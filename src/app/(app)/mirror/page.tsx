import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateProject } from '@/lib/project'
import { PriorityMirror } from '@/components/mirror/PriorityMirror'
import type { PropertyLog } from '@/types'

export default async function MirrorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getOrCreateProject(supabase, user.id)

  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const logs = (logsRaw ?? []) as PropertyLog[]

  const { data: latestAnalysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('type', 'priority')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="pb-28">
      <header className="px-5 pt-12 pb-6">
        <h1
          className="text-2xl font-bold text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          鏡
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">あなたの本当の優先度</p>
      </header>

      <main className="px-5">
        <PriorityMirror
          logs={logs}
          projectId={projectId}
          userId={user.id}
          latestAnalysis={latestAnalysis ?? null}
        />
      </main>
    </div>
  )
}

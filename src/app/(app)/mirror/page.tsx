import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getActiveProjectId, getProjectMode } from '@/lib/active-project'
import { PriorityMirror } from '@/components/mirror/PriorityMirror'
import { Card, CardContent } from '@/components/ui/card'
import type { Analysis, PropertyLog } from '@/types'

export default async function MirrorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getActiveProjectId(supabase, user.id)
  if (!projectId) redirect('/onboarding')

  const mode = await getProjectMode(supabase, projectId)

  const [
    { data: logsRaw },
    { data: members },
    { data: analysesRaw },
  ] = await Promise.all([
    supabase
      .from('property_logs')
      .select('id, score, tags_good, tags_bad, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
    supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId),
    supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .in('type', ['priority', 'alignment', 'timeline'])
      .order('created_at', { ascending: false })
  ])

  const logs = (logsRaw ?? []) as Pick<PropertyLog, 'id' | 'score' | 'tags_good' | 'tags_bad' | 'created_at'>[]
  const logDayCount = new Set(logs.map(l => l.created_at.slice(0, 10))).size
  const partnerId = members?.find((member) => member.user_id !== user.id)?.user_id ?? null
  const analyses = (analysesRaw ?? []) as Analysis[]
  const latestPriority = analyses.find((analysis) => analysis.type === 'priority') ?? null
  const latestAlignment = analyses.find((analysis) => analysis.type === 'alignment') ?? null
  const latestTimeline = analyses.find((analysis) => analysis.type === 'timeline') ?? null

  return (
    <div className="pb-28">
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="relative p-6">
            <Image
              src="/images/home_mirror.png"
              alt=""
              width={100}
              height={100}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-85 select-none pointer-events-none drop-shadow-sm"
            />
            <div className="font-brand inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 shadow-sm">
              <Sparkles className="size-3.5 text-amber-500" />
              Mirror analysis
            </div>
            <h1
              className="mt-4 text-[2rem] font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              鏡
            </h1>
            <p className="mt-2 max-w-[240px] text-sm leading-7 text-stone-500">物件候補から、重視している条件や二人の違いを整理できます。</p>
          </CardContent>
        </Card>
      </header>

      <main className="px-5">
        <PriorityMirror
          logs={logs}
          logDayCount={logDayCount}
          projectId={projectId}
          userId={user.id}
          partnerId={partnerId}
          latestPriorityAnalysis={latestPriority ?? null}
          latestAlignmentAnalysis={latestAlignment ?? null}
          latestTimelineAnalysis={latestTimeline ?? null}
          isSolo={mode === 'solo'}
        />
      </main>
    </div>
  )
}

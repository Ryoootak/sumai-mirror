import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { getOrCreateProject } from '@/lib/project'
import { PriorityMirror } from '@/components/mirror/PriorityMirror'
import { Card, CardContent } from '@/components/ui/card'
import type { PropertyLog } from '@/types'

export default async function MirrorPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getOrCreateProject(supabase, user.id)

  // 自分のログ
  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const logs = (logsRaw ?? []) as PropertyLog[]

  // パートナー確認
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
  const partnerId = members?.find((m) => m.user_id !== user.id)?.user_id ?? null

  // 3つの最新分析を並行取得
  const [
    { data: latestPriority },
    { data: latestAlignment },
    { data: latestTimeline },
  ] = await Promise.all([
    supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('type', 'priority')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('type', 'alignment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('analyses')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('type', 'timeline')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

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
              priority
            />
            <div className="font-brand inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 shadow-sm">
              <Sparkles className="size-3.5 text-amber-500" />
              Preference mirror
            </div>
            <h1
              className="mt-4 text-[2rem] font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              鏡
            </h1>
            <p className="mt-2 max-w-[200px] text-sm leading-7 text-stone-500">ログから見えてくる、本当の優先度を静かに整理します。</p>
          </CardContent>
        </Card>
      </header>

      <main className="px-5">
        <PriorityMirror
          logs={logs}
          projectId={projectId}
          userId={user.id}
          partnerId={partnerId}
          latestPriorityAnalysis={latestPriority ?? null}
          latestAlignmentAnalysis={latestAlignment ?? null}
          latestTimelineAnalysis={latestTimeline ?? null}
        />
      </main>
    </div>
  )
}

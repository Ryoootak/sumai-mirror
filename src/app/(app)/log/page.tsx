import Link from 'next/link'
import { Building2, Plus, Sparkles, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'

import { PropertyCard } from '@/components/property/PropertyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrCreateProject } from '@/lib/project'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

export default async function LogPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getOrCreateProject(supabase, user.id)

  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const logs = (logsRaw ?? []) as PropertyLog[]
  const avgScore = logs.length
    ? Math.round((logs.reduce((s, l) => s + l.score, 0) / logs.length) * 10) / 10
    : null
  const highScoreCount = logs.filter((log) => log.score >= 4).length

  return (
    <div className="pb-30">
      <header className="px-5 pb-6 pt-10">
        <div className="rounded-[1.75rem] border border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)] p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 shadow-sm">
                <Building2 className="size-3.5" strokeWidth={1.8} />
                Property journal
              </div>
              <div>
                <h1
                  className="text-[2rem] font-bold text-stone-900"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  物件ログ
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-7 text-stone-500">
                  気になった物件を静かに積み上げて、二人の判断材料を整えていきます。
                </p>
              </div>
            </div>
            <Link href="/log/new">
              <Button className="h-11 rounded-xl bg-amber-500 px-4 text-white hover:bg-amber-600">
                <Plus className="size-4" />
                記録する
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Card className="border-stone-200/70 bg-white/90 shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Entries</p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">{logs.length}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200/70 bg-white/90 shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Average</p>
                <p className="mt-2 text-2xl font-semibold text-amber-600">{avgScore ?? '--'}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200/70 bg-white/90 shadow-none">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">Liked</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-600">{highScoreCount}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      {logs.length >= 5 && (
        <div className="mb-5 px-5">
          <Link
            href="/mirror"
            className="flex items-center gap-4 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          >
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Sparkles className="size-5 shrink-0" strokeWidth={1.7} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900">鏡を見る</p>
              <p className="text-xs text-stone-500">積み上がったログから、本当の優先度を整理します</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white">
              <TrendingUp className="size-3.5" />
              Analyze
            </div>
          </Link>
        </div>
      )}

      <main className="space-y-4 px-5">
        {logs.length === 0 ? (
          <Card className="overflow-hidden border-stone-200/70">
            <CardHeader className="space-y-3">
              <CardTitle style={{ fontFamily: 'var(--font-serif)' }}>まだ記録がありません</CardTitle>
              <CardDescription>
                気になった物件をひとつずつ残していくと、あとから迷いにくくなります。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[1.25rem] bg-[linear-gradient(180deg,#fffaf5_0%,#fff 100%)] p-6">
                <div className="mx-auto max-w-xs">
                  <svg viewBox="0 0 320 220" className="h-auto w-full" role="img" aria-label="記録を始めるイラスト">
                    <rect x="26" y="34" width="268" height="152" rx="24" fill="#FFF6EC" />
                    <rect x="64" y="64" width="86" height="92" rx="16" fill="#F2D2AA" />
                    <path d="M81 117L106 83L132 117H81Z" fill="#D97706" />
                    <path d="M78 86L106.5 62L135 86" stroke="#D97706" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="170" y="72" width="90" height="14" rx="7" fill="#E8C699" />
                    <rect x="170" y="98" width="72" height="10" rx="5" fill="#E7D8CA" />
                    <rect x="170" y="118" width="82" height="10" rx="5" fill="#E7D8CA" />
                    <rect x="170" y="138" width="62" height="10" rx="5" fill="#E7D8CA" />
                  </svg>
                </div>
              </div>
              <Link href="/log/new" className="inline-flex">
                <Button className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
                  <Plus className="size-4" />
                  最初の物件を記録する
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => <PropertyCard key={log.id} log={log} />)
        )}

        {logs.length > 0 && logs.length < 5 && (
          <Card className="border-amber-200 bg-amber-50/70">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-amber-900">鏡の準備が進んでいます</p>
                <p className="text-sm text-amber-800/80">
                  あと<span className="font-bold">{5 - logs.length}件</span>で、優先度の分析が使えます。
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm">
                Soon
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <div className="fixed bottom-20 right-4">
        <Link
          href="/log/new"
          className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-4 font-semibold text-white shadow-lg transition-all hover:bg-stone-800 active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2} />
          記録する
        </Link>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { PropertyCard } from '@/components/property/PropertyCard'
import { getOrCreateProject } from '@/lib/project'
import type { PropertyLog } from '@/types'

export default async function LogPage() {
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
  const avgScore = logs.length
    ? Math.round((logs.reduce((s, l) => s + l.score, 0) / logs.length) * 10) / 10
    : null

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="px-5 pt-12 pb-5">
        <h1
          className="text-2xl font-bold text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          物件ログ
        </h1>
        {logs.length > 0 && (
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-stone-400">{logs.length}件記録済み</span>
            {avgScore !== null && (
              <>
                <span className="text-stone-200">·</span>
                <span className="text-sm text-stone-400">
                  <span className="text-amber-400">★</span> {avgScore} 平均
                </span>
              </>
            )}
          </div>
        )}
      </header>

      {/* 鏡CTA */}
      {logs.length >= 5 && (
        <div className="px-5 mb-4">
          <Link
            href="/mirror"
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3.5 text-white shadow-sm"
          >
            <Sparkles className="size-4 shrink-0" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="text-sm font-semibold">鏡を見る</p>
              <p className="text-xs text-amber-100">あなたの本当の優先度</p>
            </div>
            <span className="text-amber-200 text-sm">→</span>
          </Link>
        </div>
      )}

      {/* Log list */}
      <main className="px-5 space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-10 text-center space-y-4 mt-2">
            <div className="text-5xl">📋</div>
            <div>
              <h3
                className="font-bold text-stone-800 text-lg"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                まだ記録がありません
              </h3>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">
                気になった物件を記録しよう。<br />
                URLを貼るだけで30秒で完了。
              </p>
            </div>
            <Link
              href="/log/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition active:scale-95"
            >
              <Plus className="size-4" />
              最初の物件を記録する
            </Link>
          </div>
        ) : (
          logs.map((log) => (
            <PropertyCard key={log.id} log={log} />
          ))
        )}

        {logs.length > 0 && logs.length < 5 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-center">
            <p className="text-sm text-amber-700">
              あと<span className="font-bold">{5 - logs.length}件</span>で鏡が使えます ✨
            </p>
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="fixed bottom-20 right-4">
        <Link
          href="/log/new"
          className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-4 text-white font-semibold shadow-lg hover:bg-amber-600 active:scale-95 transition-all"
        >
          <Plus className="size-5" strokeWidth={2} />
          記録する
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Sparkles, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PropertyLog } from '@/types'

interface Priority {
  rank: number
  condition: string
  reason: string
  matchRate: number
}

interface AnalysisResult {
  priorities: Priority[]
  insight: string
  generatedAt?: string
}

interface Props {
  logs: PropertyLog[]
  projectId: string
  userId: string
  latestAnalysis: { id: string; result: Record<string, unknown>; created_at: string } | null
}

// ── Tag frequency analysis (client-side fallback) ──────────
function computeTagFrequency(logs: PropertyLog[]): { tag: string; count: number; rate: number }[] {
  const highScore = logs.filter((l) => l.score >= 4)
  if (highScore.length === 0) return []
  const freq: Record<string, number> = {}
  highScore.forEach((l) => l.tags_good.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1 }))
  const total = highScore.length
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([tag, count]) => ({ tag, count, rate: Math.round((count / total) * 100) }))
}

function computeBadFrequency(logs: PropertyLog[]): { tag: string; count: number }[] {
  const lowScore = logs.filter((l) => l.score <= 2)
  if (lowScore.length === 0) return []
  const freq: Record<string, number> = {}
  lowScore.forEach((l) => l.tags_bad.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1 }))
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
}

// ── AI Analysis section ────────────────────────────────────

function AIAnalysisCard({
  projectId,
  userId,
  logCount,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  logCount: number
  latestAnalysis: Props['latestAnalysis']
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(
    latestAnalysis ? (latestAnalysis.result as unknown as AnalysisResult) : null
  )
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'AI分析に失敗しました')
      }
      const data = await res.json()
      setResult(data.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const sendFeedback = async (fb: 'up' | 'down') => {
    setFeedback(fb)
    await fetch('/api/analyze/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, userId, feedback: fb }),
    }).catch(() => {})
  }

  if (logCount < 5) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
          AIによる深層分析
        </h2>
      </div>

      {!result ? (
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 text-center space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            {logCount}件のログをAIが分析して、<br />
            あなたが<span className="font-semibold text-amber-700">本当に重視している条件</span>を言語化します。
          </p>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                分析中（少し待ってね）
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                鏡に映してもらう
              </>
            )}
          </button>
          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Insight */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5">
            <p
              className="text-base font-medium text-stone-700 leading-relaxed"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {result.insight}
            </p>
          </div>

          {/* Priorities */}
          {result.priorities?.map((p) => (
            <div
              key={p.rank}
              className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 flex items-start gap-4"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-bold shrink-0">
                {p.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-stone-800">{p.condition}</span>
                  <span className="text-sm font-bold text-amber-600">{p.matchRate}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${p.matchRate}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-stone-500 leading-relaxed">{p.reason}</p>
              </div>
            </div>
          ))}

          {/* Feedback */}
          <div className="rounded-2xl bg-stone-50 border border-stone-100 px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-stone-500">この分析は合っていますか？</p>
            <div className="flex gap-2">
              <button
                onClick={() => sendFeedback('up')}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition',
                  feedback === 'up' ? 'bg-emerald-100 text-emerald-700' : 'text-stone-400 hover:text-stone-600'
                )}
              >
                <ThumbsUp className="size-3.5" /> 合ってる
              </button>
              <button
                onClick={() => sendFeedback('down')}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition',
                  feedback === 'down' ? 'bg-rose-100 text-rose-700' : 'text-stone-400 hover:text-stone-600'
                )}
              >
                <ThumbsDown className="size-3.5" /> 違う
              </button>
            </div>
          </div>

          {/* Re-run */}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-600 transition"
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            再分析する
          </button>
        </div>
      )}
    </section>
  )
}

// ── Main Component ─────────────────────────────────────────

export function PriorityMirror({ logs, projectId, userId, latestAnalysis }: Props) {
  const topGood = computeTagFrequency(logs)
  const topBad  = computeBadFrequency(logs)
  const highScoreCount = logs.filter((l) => l.score >= 4).length
  const avgScore = logs.length
    ? Math.round((logs.reduce((s, l) => s + l.score, 0) / logs.length) * 10) / 10
    : 0

  // Empty state
  if (logs.length < 5) {
    return (
      <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-10 text-center space-y-4">
        <div className="text-5xl">🪞</div>
        <div>
          <h3
            className="font-bold text-stone-800 text-lg"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            鏡はまだ眠っています
          </h3>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            あと<span className="font-bold text-amber-600">{5 - logs.length}件</span>記録すると、<br />
            あなたの本当の優先度が見えてきます。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-stone-800">{logs.length}</p>
          <p className="text-xs text-stone-400 mt-0.5">記録件数</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{avgScore}</p>
          <p className="text-xs text-stone-400 mt-0.5">平均スコア</p>
        </div>
        <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{highScoreCount}</p>
          <p className="text-xs text-stone-400 mt-0.5">★4以上</p>
        </div>
      </div>

      {/* Good priorities */}
      {topGood.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2
              className="text-base font-bold text-stone-800"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              やっている優先度
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">★4以上の物件で多かった「良かった点」</p>
          </div>
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm overflow-hidden">
            {topGood.map((item, i) => (
              <div
                key={item.tag}
                className={cn('px-5 py-3.5 flex items-center gap-4', i !== 0 && 'border-t border-stone-50')}
              >
                <span className="text-sm font-bold text-stone-300 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-stone-700">{item.tag}</span>
                    <span className="text-xs font-bold text-amber-600 ml-2 shrink-0">{item.rate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bad patterns */}
      {topBad.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2
              className="text-base font-bold text-stone-800"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              気になりやすい点
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">★2以下の物件で多かった「気になった点」</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {topBad.map((item) => (
              <span
                key={item.tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-sm font-medium text-rose-700"
              >
                {item.tag}
                <span className="text-rose-400 text-xs font-bold">{item.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* AI Analysis */}
      <AIAnalysisCard
        projectId={projectId}
        userId={userId}
        logCount={logs.length}
        latestAnalysis={latestAnalysis}
      />
    </div>
  )
}

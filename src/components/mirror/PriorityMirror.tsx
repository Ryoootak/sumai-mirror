'use client'

import { useState } from 'react'
import {
  ChartColumnBig, Eye, GitCompare, History,
  RefreshCw, Sparkles, Target, ThumbsDown, ThumbsUp,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { PropertyLog } from '@/types'

// ── Types ──────────────────────────────────────────────────

type MirrorLog = Pick<PropertyLog, 'id' | 'score' | 'tags_good' | 'tags_bad'>

interface AnalysisRecord {
  id: string
  result: Record<string, unknown>
  created_at: string
}

interface Priority {
  rank: number
  condition: string
  reason: string
  matchRate: number
}

interface PriorityResult {
  priorities: Priority[]
  insight: string
  generatedAt?: string
}

interface Agreement {
  condition: string
  description: string
}

interface Gap {
  topic: string
  my_tendency: string
  partner_tendency: string
  suggestion: string
}

interface AlignmentResult {
  agreements: Agreement[]
  gaps: Gap[]
  insight: string
  generatedAt?: string
}

interface EvolutionPhase {
  phase: string
  tendency: string
}

interface TimelineResult {
  evolution: EvolutionPhase[]
  narrowed_down: string[]
  still_open: string[]
  insight: string
  generatedAt?: string
}

interface Props {
  logs: MirrorLog[]
  projectId: string
  userId: string
  partnerId: string | null
  latestPriorityAnalysis: AnalysisRecord | null
  latestAlignmentAnalysis: AnalysisRecord | null
  latestTimelineAnalysis: AnalysisRecord | null
  isSolo?: boolean
}

// ── Helpers ─────────────────────────────────────────────────

function computeTagFrequency(logs: MirrorLog[]): { tag: string; count: number; rate: number }[] {
  const highScore = logs.filter((l) => l.score === 3)
  if (highScore.length === 0) return []
  const freq: Record<string, number> = {}
  highScore.forEach((l) => l.tags_good.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1 }))
  const total = highScore.length
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([tag, count]) => ({ tag, count, rate: Math.round((count / total) * 100) }))
}

function computeBadFrequency(logs: MirrorLog[]): { tag: string; count: number }[] {
  const lowScore = logs.filter((l) => l.score === 1)
  if (lowScore.length === 0) return []
  const freq: Record<string, number> = {}
  lowScore.forEach((l) => l.tags_bad.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1 }))
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))
}

function MirrorIllustration() {
  return (
    <svg viewBox="0 0 360 240" className="h-auto w-full" role="img" aria-label="価値観の鏡のイラスト">
      <rect x="28" y="26" width="304" height="188" rx="28" fill="#FFF7ED" />
      <rect x="78" y="54" width="92" height="124" rx="44" fill="#F5D8AD" />
      <rect x="92" y="68" width="64" height="96" rx="32" fill="#FFFFFF" />
      <rect x="108" y="168" width="32" height="28" rx="12" fill="#D97706" />
      <rect x="198" y="72" width="94" height="14" rx="7" fill="#E8C699" />
      <rect x="198" y="98" width="108" height="10" rx="5" fill="#E7D8CA" />
      <rect x="198" y="118" width="84" height="10" rx="5" fill="#E7D8CA" />
      <rect x="198" y="138" width="74" height="10" rx="5" fill="#E7D8CA" />
      <circle cx="280" cy="170" r="18" fill="#F5D8AD" />
      <path d="M271 170L278 177L290 163" stroke="#D97706" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InsightHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="font-brand inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 shadow-sm">
      {icon}
      {label}
    </div>
  )
}

function FeedbackBar({
  projectId,
  userId,
  type,
}: {
  projectId: string
  userId: string
  type: 'priority' | 'alignment' | 'timeline'
}) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const send = async (fb: 'up' | 'down') => {
    setFeedback(fb)
    await fetch('/api/analyze/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, userId, feedback: fb, type }),
    }).catch(() => {})
  }

  return (
    <Card className="border-stone-200/80">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-500">この分析は合っていますか？</p>
        <div className="flex gap-2">
          <button
            onClick={() => send('up')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition',
              feedback === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            )}
          >
            <ThumbsUp className="size-3.5" /> 合ってる
          </button>
          <button
            onClick={() => send('down')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition',
              feedback === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            )}
          >
            <ThumbsDown className="size-3.5" /> 違う
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── 鏡1: 優先度の鏡 ────────────────────────────────────────

function Mirror1Card({
  projectId,
  userId,
  logCount,
  logs,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  logCount: number
  logs: MirrorLog[]
  latestAnalysis: AnalysisRecord | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PriorityResult | null>(
    latestAnalysis ? (latestAnalysis.result as unknown as PriorityResult) : null
  )

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI分析に失敗しました')
      setResult(data.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const tagFreq = computeTagFrequency(logs)
  const badFreq = computeBadFrequency(logs)

  if (logCount < 5) {
    return (
      <Card className="overflow-hidden border-amber-100 bg-amber-50/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-stone-700">鏡1 — 優先度の鏡</span>
          </div>
          <p className="text-sm text-stone-500">
            あと<span className="font-bold text-amber-600">{5 - logCount}件</span>記録すると解放されます
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
          鏡1 — 優先度の鏡
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto rounded-xl">見方</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>優先度の鏡とは</DialogTitle>
              <DialogDescription>
                「最高」と「ありかな」のギャップから、言葉にしていない本当の条件を読み取ります。
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {!result ? (
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff_100%)]">
          <CardContent className="space-y-5 p-6">
            <div className="grid items-center gap-5 sm:grid-cols-[1fr_0.8fr]">
              <div className="space-y-3">
                <p className="text-sm leading-7 text-stone-600">
                  {logCount}件のログから、
                  <span className="font-semibold text-amber-700">本当に重視している条件</span>をAIが読み解きます。
                </p>
                <Button onClick={run} disabled={loading} className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
                  {loading ? <><RefreshCw className="size-4 animate-spin" />分析中</> : <><Sparkles className="size-4" />鏡に映してもらう</>}
                </Button>
                {error && <p className="text-sm text-rose-500">{error}</p>}
              </div>
              <MirrorIllustration />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 space-y-3">
              <InsightHeader icon={<Eye className="size-3.5" />} label="Your mirror" />
              <p className="text-lg font-medium leading-relaxed text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
                {result.insight}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="priority">
            <TabsList>
              <TabsTrigger value="priority">Priority</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
            </TabsList>

            <TabsContent value="priority" className="space-y-3">
              {result.priorities?.map((p) => (
                <Card key={p.rank}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-sm font-semibold text-white">
                      {p.rank}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-stone-900">{p.condition}</span>
                        <span className="text-sm font-semibold text-amber-700">{p.matchRate}%</span>
                      </div>
                      <Progress value={p.matchRate} />
                      <p className="mt-3 text-sm leading-7 text-stone-500">{p.reason}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="signals" className="space-y-4">
              {tagFreq.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="size-4 text-amber-600" />
                      「最高」に共通する条件
                    </CardTitle>
                    <CardDescription>評価「最高」の物件で繰り返し現れる要素です。</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tagFreq.map((item, i) => (
                      <div key={item.tag} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-semibold text-amber-700">{i + 1}</span>
                            <span className="text-sm font-medium text-stone-800">{item.tag}</span>
                          </div>
                          <span className="text-xs font-semibold text-stone-500">{item.rate}%</span>
                        </div>
                        <Progress value={item.rate} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {badFreq.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartColumnBig className="size-4 text-stone-700" />
                      引っかかりやすいポイント
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {badFreq.map((item) => (
                      <span key={item.tag} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
                        {item.tag}
                        <span className="text-xs font-bold text-rose-400">{item.count}</span>
                      </span>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button onClick={run} disabled={loading} variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              再分析
            </Button>
          </div>
          <FeedbackBar projectId={projectId} userId={userId} type="priority" />
        </div>
      )}
    </section>
  )
}

// ── 鏡2: ズレの鏡 ──────────────────────────────────────────

function Mirror2Card({
  projectId,
  userId,
  partnerId,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  partnerId: string | null
  latestAnalysis: AnalysisRecord | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AlignmentResult | null>(
    latestAnalysis ? (latestAnalysis.result as unknown as AlignmentResult) : null
  )

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze/alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId, partnerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI分析に失敗しました')
      setResult(data.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (!partnerId) {
    return (
      <Card className="overflow-hidden border-stone-100 bg-stone-50/60">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="size-4 text-stone-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-stone-500">鏡2 — ズレの鏡</span>
          </div>
          <p className="text-sm text-stone-400">ペア設定後に解放されます</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <GitCompare className="size-4 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
          鏡2 — ズレの鏡
        </h2>
      </div>

      {!result ? (
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff_100%)]">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              二人のログを比較して、<span className="font-semibold text-amber-700">好みの一致点とズレ</span>を整理します。
            </p>
            <Button onClick={run} disabled={loading} className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
              {loading ? <><RefreshCw className="size-4 animate-spin" />分析中</> : <><GitCompare className="size-4" />二人を比べてみる</>}
            </Button>
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 space-y-3">
              <InsightHeader icon={<Eye className="size-3.5" />} label="Pair insight" />
              <p className="text-lg font-medium leading-relaxed text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
                {result.insight}
              </p>
            </CardContent>
          </Card>

          {result.agreements?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">二人が一致している点</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.agreements.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{a.condition}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{a.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.gaps?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">話し合うといいテーマ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.gaps.map((g, i) => (
                  <div key={i} className="rounded-2xl border border-stone-100 bg-stone-50 p-4 space-y-2">
                    <p className="text-sm font-semibold text-stone-800">{g.topic}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-amber-50 px-3 py-2">
                        <p className="text-amber-700 font-medium mb-1">私</p>
                        <p className="text-stone-600">{g.my_tendency}</p>
                      </div>
                      <div className="rounded-xl bg-sky-50 px-3 py-2">
                        <p className="text-sky-700 font-medium mb-1">パートナー</p>
                        <p className="text-stone-600">{g.partner_tendency}</p>
                      </div>
                    </div>
                    <p className="text-xs text-stone-500 pl-1">{g.suggestion}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={run} disabled={loading} variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              再分析
            </Button>
          </div>
          <FeedbackBar projectId={projectId} userId={userId} type="alignment" />
        </div>
      )}
    </section>
  )
}

// ── 鏡3: 変化の鏡 ──────────────────────────────────────────

function Mirror3Card({
  projectId,
  userId,
  logCount,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  logCount: number
  latestAnalysis: AnalysisRecord | null
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TimelineResult | null>(
    latestAnalysis ? (latestAnalysis.result as unknown as TimelineResult) : null
  )

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'AI分析に失敗しました')
      setResult(data.result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (logCount < 10) {
    return (
      <Card className="overflow-hidden border-amber-100 bg-amber-50/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="size-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-stone-700">鏡3 — 変化の鏡</span>
          </div>
          <p className="text-sm text-stone-500">
            あと<span className="font-bold text-amber-600">{10 - logCount}件</span>記録すると解放されます
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="size-4 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
          鏡3 — 変化の鏡
        </h2>
      </div>

      {!result ? (
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff_100%)]">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              {logCount}件のログを時系列で分析して、<span className="font-semibold text-amber-700">好みの変化と絞り込み</span>を整理します。
            </p>
            <Button onClick={run} disabled={loading} className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
              {loading ? <><RefreshCw className="size-4 animate-spin" />分析中</> : <><History className="size-4" />変化を振り返る</>}
            </Button>
            {error && <p className="text-sm text-rose-500">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 space-y-3">
              <InsightHeader icon={<Eye className="size-3.5" />} label="Your journey" />
              <p className="text-lg font-medium leading-relaxed text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
                {result.insight}
              </p>
            </CardContent>
          </Card>

          {result.evolution?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">家探しの流れ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.evolution.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="shrink-0 rounded-full bg-stone-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">{e.phase}</span>
                    <p className="text-sm leading-6 text-stone-600">{e.tendency}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            {result.narrowed_down?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-emerald-700">絞られてきた条件</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5 pt-0">
                  {result.narrowed_down.map((c, i) => (
                    <span key={i} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {c}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}
            {result.still_open?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-amber-700">まだ迷っている点</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5 pt-0">
                  {result.still_open.map((c, i) => (
                    <span key={i} className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">
                      {c}
                    </span>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={run} disabled={loading} variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              再分析
            </Button>
          </div>
          <FeedbackBar projectId={projectId} userId={userId} type="timeline" />
        </div>
      )}
    </section>
  )
}

// ── Main ────────────────────────────────────────────────────

export function PriorityMirror({
  logs,
  projectId,
  userId,
  partnerId,
  latestPriorityAnalysis,
  latestAlignmentAnalysis,
  latestTimelineAnalysis,
  isSolo = false,
}: Props) {
  if (logs.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_0.9fr] sm:items-center">
          <div>
            <div className="font-brand inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              <Sparkles className="size-3.5" />
              Mirror waiting
            </div>
            <h3 className="mt-4 text-xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
              鏡はまだ眠っています
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">
              物件を記録していくと、あなたの本当の優先度が見えてきます。
            </p>
          </div>
          <MirrorIllustration />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 3つの鏡 */}
      <Mirror1Card
        projectId={projectId}
        userId={userId}
        logCount={logs.length}
        logs={logs}
        latestAnalysis={latestPriorityAnalysis}
      />
      {!isSolo && (
        <Mirror2Card
          projectId={projectId}
          userId={userId}
          partnerId={partnerId}
          latestAnalysis={latestAlignmentAnalysis}
        />
      )}
      <Mirror3Card
        projectId={projectId}
        userId={userId}
        logCount={logs.length}
        latestAnalysis={latestTimelineAnalysis}
      />
    </div>
  )
}

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

type MirrorLog = Pick<PropertyLog, 'id' | 'score' | 'tags_good' | 'tags_bad' | 'memo'>

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
  logDayCount: number
  memoCount: number
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
    <svg viewBox="0 0 360 240" className="h-auto w-full" role="img" aria-label="好みの分析のイラスト">
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
    <div className="font-brand inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6a5848] shadow-sm">
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
              feedback === 'up' ? 'bg-amber-100 text-amber-800' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            )}
          >
            <ThumbsUp className="size-3.5" /> 合ってる
          </button>
          <button
            onClick={() => send('down')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition',
              feedback === 'down' ? 'bg-[#efe1d1] text-[#6a5848]' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
            )}
          >
            <ThumbsDown className="size-3.5" /> 違う
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── 物件選びの傾向 ─────────────────────────────────────────

function Mirror1Card({
  projectId,
  userId,
  logCount,
  memoCount,
  logs,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  logCount: number
  memoCount: number
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

  if (logCount === 0) {
    return (
      <Card className="overflow-hidden border-amber-100 bg-amber-50/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-stone-700">物件選びの傾向</span>
          </div>
          <p className="text-sm text-stone-500">
            候補を1件追加すると、よく見ている条件の並び方を確認できます。
          </p>
        </CardContent>
      </Card>
    )
  }

  if (logCount < 5 && !result) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
            物件選びの傾向
          </h2>
        </div>

        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff_100%)]">
          <CardContent className="grid gap-5 p-6 sm:grid-cols-[1fr_0.8fr] sm:items-center">
            <div className="space-y-3">
              <p className="text-sm leading-7 text-stone-600">
                今ある候補から、よく選んでいる条件や気になりやすい点を先に見られます。
                <span className="font-semibold text-amber-700">あと{5 - logCount}件</span>たまると、AIが傾向をまとめます。
              </p>
              <div className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm">
                候補の可視化は利用中
              </div>
            </div>
            <MirrorIllustration />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4 text-amber-600" />
                よく選んでいる条件
              </CardTitle>
              <CardDescription>評価が高かった候補でよく出ているポイントです。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tagFreq.length > 0 ? tagFreq.map((item, i) => (
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
              )) : (
                <p className="text-sm leading-7 text-stone-500">評価が高い候補にタグを付けると、ここに共通点が並びます。</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartColumnBig className="size-4 text-stone-700" />
                気になりやすい点
              </CardTitle>
              <CardDescription>評価が低めだった候補で繰り返し出ているポイントです。</CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-32 flex-wrap gap-2">
              {badFreq.length > 0 ? badFreq.map((item) => (
                <span key={item.tag} className="inline-flex items-center gap-2 rounded-full border border-[#e7d3bc] bg-[#fbf4ea] px-3 py-1.5 text-sm font-medium text-[#6a5848]">
                  {item.tag}
                  <span className="text-xs font-bold text-[#c47a2c]">{item.count}</span>
                </span>
              )) : (
                <p className="text-sm leading-7 text-stone-500">気になった点にタグを付けると、ここで傾向を見返せます。</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-amber-500" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
          物件選びの傾向
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto rounded-xl">見方</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>物件選びの傾向とは</DialogTitle>
              <DialogDescription>
                候補の評価とタグから、重視している条件を整理します。5件以上たまるとAIが要約します。
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
                  {logCount}件の候補から、
                  <span className="font-semibold text-amber-700">重視している条件</span>をAIが読み解きます。
                </p>
                {memoCount < logCount && (
                  <p className="text-xs text-stone-400">
                    メモあり {memoCount}/{logCount}件。メモが増えるほど分析が深くなります。
                  </p>
                )}
                <Button onClick={run} disabled={loading} className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
                  {loading ? <><RefreshCw className="size-4 animate-spin" />分析中</> : <><Sparkles className="size-4" />AIで整理する</>}
                </Button>
                {error && <p className="text-sm text-[#b65e2a]">{error}</p>}
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
              <p className="text-sm leading-7 text-stone-700 sm:text-[0.95rem]" style={{ fontFamily: 'var(--font-serif)' }}>
                {result.insight}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="priority">
            <TabsList>
              <TabsTrigger value="priority">重視条件</TabsTrigger>
              <TabsTrigger value="signals">傾向</TabsTrigger>
            </TabsList>

            <TabsContent value="priority" className="space-y-3">
              {result.priorities?.map((p) => (
                <Card key={p.rank}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#3c3128] text-sm font-semibold text-white">
                      {p.rank}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-semibold text-stone-800">{p.condition}</span>
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
                      「かなりいい」に共通する条件
                    </CardTitle>
                    <CardDescription>評価「かなりいい」の物件で繰り返し現れる要素です。</CardDescription>
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
                      <span key={item.tag} className="inline-flex items-center gap-2 rounded-full border border-[#e7d3bc] bg-[#fbf4ea] px-3 py-1.5 text-sm font-medium text-[#6a5848]">
                        {item.tag}
                        <span className="text-xs font-bold text-[#c47a2c]">{item.count}</span>
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

// ── パートナーとのすり合わせ ───────────────────────────────

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
            <span className="text-sm font-semibold text-stone-500">パートナーとのすり合わせ</span>
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
          パートナーとのすり合わせ
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
            {error && <p className="text-sm text-[#b65e2a]">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 space-y-3">
              <InsightHeader icon={<Eye className="size-3.5" />} label="Pair insight" />
              <p className="text-sm leading-7 text-stone-700 sm:text-[0.95rem]" style={{ fontFamily: 'var(--font-serif)' }}>
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">✓</span>
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
                  <div key={i} className="space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4">
                    <p className="text-sm font-semibold text-stone-800">{g.topic}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-amber-50 px-3 py-2">
                        <p className="text-amber-700 font-medium mb-1">私</p>
                        <p className="text-stone-600">{g.my_tendency}</p>
                      </div>
                      <div className="rounded-xl bg-[#f5ede3] px-3 py-2">
                        <p className="mb-1 font-medium text-[#6a5848]">パートナー</p>
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

// ── 好みの変遷 ────────────────────────────────────────────

function Mirror3Card({
  projectId,
  userId,
  logDayCount,
  latestAnalysis,
}: {
  projectId: string
  userId: string
  logDayCount: number
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

  if (logDayCount < 5) {
    return (
      <Card className="overflow-hidden border-amber-100 bg-amber-50/40">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="size-4 text-amber-400" strokeWidth={1.5} />
            <span className="text-sm font-semibold text-stone-700">好みの変遷</span>
          </div>
          <p className="text-sm text-stone-500">
            あと<span className="font-bold text-amber-600">{5 - logDayCount}日分</span>候補を見ていくと解放されます
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
          好みの変遷
        </h2>
      </div>

      {!result ? (
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff_100%)]">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm leading-7 text-stone-600">
              {logDayCount}日分のログを時系列で分析して、<span className="font-semibold text-amber-700">好みの変化と絞り込み</span>を整理します。
            </p>
            <Button onClick={run} disabled={loading} className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600">
              {loading ? <><RefreshCw className="size-4 animate-spin" />分析中</> : <><History className="size-4" />変化を振り返る</>}
            </Button>
            {error && <p className="text-sm text-[#b65e2a]">{error}</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 space-y-3">
              <InsightHeader icon={<Eye className="size-3.5" />} label="Your journey" />
              <p className="text-sm leading-7 text-stone-700 sm:text-[0.95rem]" style={{ fontFamily: 'var(--font-serif)' }}>
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
                    <span className="shrink-0 rounded-full bg-[#3c3128] px-2.5 py-0.5 text-[10px] font-semibold text-white">{e.phase}</span>
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
                  <CardTitle className="text-xs text-[#9a5b19]">絞られてきた条件</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5 pt-0">
                  {result.narrowed_down.map((c, i) => (
                    <span key={i} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-[#9a5b19]">
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
  logDayCount,
  memoCount,
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
              Preference analysis
            </div>
            <h3 className="mt-4 text-xl font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
              まだ分析できるデータがありません
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">
              物件候補を1件追加すると、よく見ている条件の確認ができます。5件たまるとAI分析も使えます。
            </p>
          </div>
          <MirrorIllustration />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 3つの分析 */}
      <Mirror1Card
        projectId={projectId}
        userId={userId}
        logCount={logs.length}
        memoCount={memoCount}
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
        logDayCount={logDayCount}
        latestAnalysis={latestTimelineAnalysis}
      />
    </div>
  )
}

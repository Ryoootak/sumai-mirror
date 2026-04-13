'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { ChartColumnBig, Eye, RefreshCw, Sparkles, Target, ThumbsDown, ThumbsUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

function ReferenceImageCard() {
  const [loaded, setLoaded] = useState(false)
  const src = 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <img
          src={src}
          alt="落ち着いた住空間の参考イメージ"
          className={cn('h-full w-full object-cover transition duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={() => setLoaded(true)}
        />
      </div>
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-stone-900">Reference mood</p>
        <p className="mt-1 text-sm leading-relaxed text-stone-500">
          余白があり、光がやわらかい空間は、今のログの好みとも相性がよさそうです。
        </p>
      </CardContent>
    </Card>
  )
}

function AIAnalysisCard({
  projectId,
  userId,
  logCount,
  latestAnalysis,
  logs,
}: {
  projectId: string
  userId: string
  logCount: number
  latestAnalysis: Props['latestAnalysis']
  logs: PropertyLog[]
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" strokeWidth={1.5} />
          <h2 className="text-base font-bold text-stone-800" style={{ fontFamily: 'var(--font-serif)' }}>
            AIによる深層分析
          </h2>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-xl">
              見方
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>この分析の見方</DialogTitle>
              <DialogDescription>
                ログのスコアやタグの偏りから、無意識に大切にしている条件をまとめています。
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {!result ? (
        <Card className="border-amber-200 bg-[linear-gradient(180deg,#fffaf5_0%,#fff 100%)]">
          <CardContent className="space-y-5 p-6">
            <div className="grid items-center gap-5 sm:grid-cols-[1fr_0.8fr]">
              <div className="space-y-3">
                <p className="text-sm leading-7 text-stone-600">
                  {logCount}件のログをAIが分析して、
                  <span className="font-semibold text-amber-700">本当に重視している条件</span>を言語化します。
                </p>
                <Button
                  onClick={runAnalysis}
                  disabled={loading}
                  className="h-11 rounded-xl bg-amber-500 px-5 text-white hover:bg-amber-600"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      分析中
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      鏡に映してもらう
                    </>
                  )}
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
            <CardContent className="grid gap-5 p-6 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
                  <Eye className="size-3.5" />
                  Your mirror
                </div>
                <p
                  className="text-lg font-medium leading-relaxed text-stone-800"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  {result.insight}
                </p>
              </div>
              <ReferenceImageCard />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="size-4 text-amber-600" />
                    良い反応が集まる条件
                  </CardTitle>
                  <CardDescription>★4以上の物件で繰り返し現れる要素です。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {computeTagFrequency(logs).map((item, i) => (
                    <div key={item.tag} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-semibold text-amber-700">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-stone-800">{item.tag}</span>
                        </div>
                        <span className="text-xs font-semibold text-stone-500">{item.rate}%</span>
                      </div>
                      <Progress value={item.rate} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {computeBadFrequency(logs).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartColumnBig className="size-4 text-stone-700" />
                      引っかかりやすいポイント
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {computeBadFrequency(logs).map((item) => (
                      <span
                        key={item.tag}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700"
                      >
                        {item.tag}
                        <span className="text-xs font-bold text-rose-400">{item.count}</span>
                      </span>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <Card className="border-stone-200/80">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-500">この分析は合っていますか？</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sendFeedback('up')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition',
                    feedback === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  )}
                >
                  <ThumbsUp className="size-3.5" /> 合ってる
                </button>
                <button
                  onClick={() => sendFeedback('down')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm transition',
                    feedback === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                  )}
                >
                  <ThumbsDown className="size-3.5" /> 違う
                </button>
                <Button onClick={runAnalysis} disabled={loading} variant="outline" className="rounded-xl">
                  <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
                  再分析する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

export function PriorityMirror({ logs, projectId, userId, latestAnalysis }: Props) {
  const highScoreCount = logs.filter((l) => l.score >= 4).length
  const avgScore = logs.length
    ? Math.round((logs.reduce((s, l) => s + l.score, 0) / logs.length) * 10) / 10
    : 0

  if (logs.length < 5) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 sm:grid-cols-[1fr_0.9fr] sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
              <Sparkles className="size-3.5" />
              Mirror waiting
            </div>
            <h3
              className="mt-4 text-xl font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              鏡はまだ眠っています
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">
              あと<span className="font-bold text-amber-600">{5 - logs.length}件</span>記録すると、
              あなたの本当の優先度が見えてきます。
            </p>
          </div>
          <MirrorIllustration />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
        <CardContent className="grid gap-5 p-6 sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
              <Sparkles className="size-3.5 text-amber-500" />
              Preference mirror
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                あなたの好みを、
                <br />
                もっと静かに読み解く
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                ログの蓄積から、何に惹かれ、何に引っかかるのかを整理します。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-stone-200/70 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Entries</p>
                  <p className="mt-2 text-2xl font-semibold text-stone-900">{logs.length}</p>
                </CardContent>
              </Card>
              <Card className="border-stone-200/70 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Average</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-600">{avgScore}</p>
                </CardContent>
              </Card>
              <Card className="border-stone-200/70 shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Liked</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-600">{highScoreCount}</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <ReferenceImageCard />
        </CardContent>
      </Card>

      <AIAnalysisCard
        projectId={projectId}
        userId={userId}
        logCount={logs.length}
        latestAnalysis={latestAnalysis}
        logs={logs}
      />
    </div>
  )
}

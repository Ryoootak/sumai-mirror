import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

const SCORE_LABEL: Record<number, string> = { 3: '最高', 2: 'いいな', 1: 'ありかな' }

function formatLogsChronological(logs: PropertyLog[]): string {
  return logs.map((l, i) => {
    const score = SCORE_LABEL[l.score] ?? `スコア${l.score}`
    const date = new Date(l.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    const goodTags = l.tags_good.length ? `良かった点: ${l.tags_good.join('、')}` : ''
    const badTags  = l.tags_bad.length  ? `気になった点: ${l.tags_bad.join('、')}` : ''
    const memo     = l.memo ? `メモ: ${l.memo}` : ''
    return [
      `【${i + 1}件目 ${date}】${l.title ?? '名称未設定'} / 評価: ${score}`,
      goodTags, badTags, memo,
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, userId } = body as { projectId: string; userId: string }

  if (!projectId || userId !== user.id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 古い順で取得
  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  const logs = (logsRaw ?? []) as PropertyLog[]

  if (logs.length < 5) {
    return NextResponse.json({ error: 'ログが5件以上必要です' }, { status: 422 })
  }

  const logsText = formatLogsChronological(logs)

  const prompt = `家探し中のユーザーの記録を時系列で分析してください。
初期と最近で評価の傾向がどう変化したか、何が絞られてきたかを整理します。

## ログデータ（古い順）
${logsText}

## 分析の視点（必ず守ること）
1. 序盤（最初の3分の1）と終盤（最後の3分の1）で「最高」をつけた物件の共通点の変化 → 軸がどう定まってきたか
2. 序盤に多く選んでいたタグが終盤に消えている場合 → あきらめた条件か、重要でないと気づいた条件
3. 終盤だけに現れるタグ → 探索を経て発見した新しい価値観
4. メモの文体の変化（「迷ってます」「どうかな」→「やっぱり〇〇が大事」）も判断材料にする
5. 「まだ迷っている条件」は正直に出す。無理に絞り込まない

## 出力形式（JSONのみ。前後の説明文不要）
{
  "evolution": [
    {
      "phase": "序盤",
      "tendency": "この時期の傾向（1〜2文）"
    },
    {
      "phase": "中盤",
      "tendency": "この時期の傾向（1〜2文）"
    },
    {
      "phase": "終盤",
      "tendency": "この時期の傾向（1〜2文）"
    }
  ],
  "narrowed_down": ["絞られてきた条件1", "絞られてきた条件2", "絞られてきた条件3"],
  "still_open": ["まだ迷っている条件1", "まだ迷っている条件2"],
  "insight": "家探しの旅の全体像を語りかけで2〜3文。成長や発見を肯定的に伝える。"
}`

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  let responseText: string
  try {
    const result = await model.generateContent(prompt)
    responseText = result.response.text()
  } catch (e) {
    console.error('Gemini error:', e)
    return NextResponse.json({ error: 'AI分析に失敗しました' }, { status: 500 })
  }

  let analysisResult
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    analysisResult = JSON.parse(jsonMatch[0])
    analysisResult.generatedAt = new Date().toISOString()
  } catch {
    return NextResponse.json({ error: 'AI応答の解析に失敗しました' }, { status: 500 })
  }

  await supabase.from('analyses').insert({
    project_id: projectId,
    user_id: user.id,
    type: 'timeline',
    result: analysisResult,
  })

  return NextResponse.json({ result: analysisResult })
}

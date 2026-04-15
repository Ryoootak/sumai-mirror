import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

const SCORE_LABEL: Record<number, string> = { 3: '最高', 2: 'いいな', 1: 'ありかな' }
const TYPE_LABEL: Record<string, string> = { mansion: 'マンション', house: '戸建て', land: '土地' }

function formatLogs(logs: PropertyLog[]): string {
  return logs.map((l, i) => {
    const score    = SCORE_LABEL[l.score] ?? `スコア${l.score}`
    const type     = l.property_type ? `種別: ${TYPE_LABEL[l.property_type]}` : ''
    const goodTags = l.tags_good.length ? `良かった点: ${l.tags_good.join('、')}` : ''
    const badTags  = l.tags_bad.length  ? `気になった点: ${l.tags_bad.join('、')}` : ''
    const memo     = l.memo ? `メモ: ${l.memo}` : ''
    return [
      `【物件${i + 1}】${l.title ?? '名称未設定'} / 評価: ${score}`,
      type, goodTags, badTags, memo,
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

  // メンバー確認
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ログ取得
  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  const logs = (logsRaw ?? []) as PropertyLog[]

  if (logs.length < 5) {
    return NextResponse.json({ error: 'ログが5件以上必要です' }, { status: 422 })
  }

  const logsText = formatLogs(logs)

  const prompt = `あなたは住まい選びの行動分析の専門家です。
ユーザーが記録した物件ログを読み、言葉ではなく行動から本当の優先度を見抜いてください。

## 評価スケール
「最高」＞「いいな」＞「ありかな」の3段階です。
全件がポジティブな記録なので、「最高」と「ありかな」のギャップが核心です。

## ログデータ
${logsText}

## 分析の視点（必ず守ること）
1. 「最高」評価の物件に共通するタグ・表現 → 無意識の絶対条件
2. 「最高」と「ありかな」で同じタグがついている場合 → そのタグは差別化要因ではない、除外する
3. 「ありかな」物件のメモに「でも」「けど」「が…」などの逆接がある場合 → 何かを我慢している
4. 条件は抽象的にせず具体的に（「広さ」ではなく「リビングの開放感・採光」のように）
5. 物件種別（マンション/戸建て/土地）の内訳と、高評価に偏りがある場合はその傾向も読み取る

## 出力形式（JSONのみ。前後の説明文不要）
{
  "priorities": [
    {
      "rank": 1,
      "condition": "条件名（12文字以内）",
      "reason": "なぜこう判断したか。物件名や評価を引用して具体的に（2文）",
      "matchRate": 85
    }
  ],
  "insight": "全体的な傾向をユーザーへの語りかけで2〜3文。発見した矛盾や無意識の癖を温かく伝える。"
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

  // JSONパース
  let analysisResult
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    analysisResult = JSON.parse(jsonMatch[0])
    analysisResult.generatedAt = new Date().toISOString()
  } catch {
    return NextResponse.json({ error: 'AI応答の解析に失敗しました' }, { status: 500 })
  }

  // DB保存
  await supabase.from('analyses').insert({
    project_id: projectId,
    user_id: user.id,
    type: 'priority',
    result: analysisResult,
  })

  return NextResponse.json({ result: analysisResult })
}

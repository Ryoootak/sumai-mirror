import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

const SCORE_LABEL: Record<number, string> = { 3: 'かなりいい', 2: 'いいな', 1: 'ありかな' }
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

function formatPreferences(preferences: Record<string, unknown> | null | undefined): string {
  if (!preferences) return '未設定'

  const entries = [
    ['希望エリア', preferences.area],
    ['予算感', preferences.budget],
    ['広さ・間取り', preferences.layout],
    ['外せない条件', preferences.must_have],
    ['避けたい条件', preferences.avoid],
  ].filter(([, value]) => typeof value === 'string' && value.trim().length > 0)

  if (entries.length === 0) return '未設定'

  return entries.map(([label, value]) => `${label}: ${String(value)}`).join('\n')
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
    return NextResponse.json({ error: 'AI分析には候補が5件以上必要です' }, { status: 422 })
  }

  const logsText = formatLogs(logs)
  const { data: profile } = await supabase
    .from('users_profile')
    .select('preferences')
    .eq('id', user.id)
    .single()
  const preferencesText = formatPreferences((profile?.preferences ?? null) as Record<string, unknown> | null)

  const prompt = `あなたは住まい選びの行動分析の専門家です。
ユーザーが追加した物件候補を読み、言葉ではなく行動から重視している条件を見抜いてください。

## 評価スケール
「かなりいい」＞「いいな」＞「ありかな」の3段階です。
全件がポジティブな記録なので、「かなりいい」と「ありかな」のギャップが核心です。

## 設定タブの希望条件
${preferencesText}

## ログデータ
${logsText}

## 分析の視点（必ず守ること）
1. 「かなりいい」評価の物件に共通するタグ・表現 → 無意識の絶対条件
2. 「かなりいい」と「ありかな」で同じタグがついている場合 → そのタグは差別化要因ではない、除外する
3. 「ありかな」物件のメモに「でも」「けど」「が…」などの逆接がある場合 → 何かを我慢している
4. 条件は抽象的にせず具体的に（「広さ」ではなく「リビングの開放感・採光」のように）
5. 物件種別（マンション/戸建て/土地）の内訳と、高評価に偏りがある場合はその傾向も読み取る
6. 設定タブの希望条件と、実際の行動ログが一致している点・ズレている点の両方を見る
7. ユーザーが言語化している希望条件より、実際の行動でより強く出ている条件があれば優先して書く

## 出力形式（JSONのみ。前後の説明文不要）
{
  "priorities": [
    {
      "rank": 1,
      "condition": "条件名（12文字以内）",
      "reason": "なぜこう判断したか。物件名や評価を引用して具体的に（3〜4文）",
      "matchRate": 85
    }
  ],
  "insight": "全体的な傾向をユーザーへの語りかけで4〜6文。設定条件との一致やズレ、無意識の癖、次に見るべき視点まで含めて、温かく具体的に伝える。"
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

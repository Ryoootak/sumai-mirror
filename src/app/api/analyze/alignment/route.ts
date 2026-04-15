import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

const SCORE_LABEL: Record<number, string> = { 3: '最高', 2: 'いいな', 1: 'ありかな' }

function formatLogs(logs: PropertyLog[], label: string): string {
  if (logs.length === 0) return `${label}のログはまだありません。`
  return logs.map((l, i) => {
    const score = SCORE_LABEL[l.score] ?? `スコア${l.score}`
    const goodTags = l.tags_good.length ? `良かった点: ${l.tags_good.join('、')}` : ''
    const badTags  = l.tags_bad.length  ? `気になった点: ${l.tags_bad.join('、')}` : ''
    const memo     = l.memo ? `メモ: ${l.memo}` : ''
    return [
      `【${label}物件${i + 1}】${l.title ?? '名称未設定'} / 評価: ${score}`,
      goodTags, badTags, memo,
    ].filter(Boolean).join('\n')
  }).join('\n\n')
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, userId, partnerId } = body as {
    projectId: string
    userId: string
    partnerId: string
  }

  if (!projectId || userId !== user.id || !partnerId) {
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

  // 自分とパートナーのログを取得
  const { data: allLogsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const allLogs = (allLogsRaw ?? []) as PropertyLog[]
  const myLogs = allLogs.filter((l) => l.user_id === userId)
  const partnerLogs = allLogs.filter((l) => l.user_id === partnerId)

  if (myLogs.length < 5 || partnerLogs.length < 5) {
    return NextResponse.json({ error: '二人それぞれ5件以上のログが必要です' }, { status: 422 })
  }

  const myLogsText = formatLogs(myLogs, '私の')
  const partnerLogsText = formatLogs(partnerLogs, 'パートナーの')

  const prompt = `二人で家探しをしているカップルの記録を分析してください。
同じプロジェクトで記録した二人の評価を比較し、「合っている点」と「ズレている点」を整理します。

## 私の記録
${myLogsText}

## パートナーの記録
${partnerLogsText}

## 分析の視点（必ず守ること）
1. 同じ物件名・または同系統の物件で評価が一致している場合 → 二人の共通の軸
2. 評価が異なる物件 → 最も重要なズレのヒント。タグの差に注目する
3. 片方だけ「最高」をつけた物件 → 何が響いて何が刺さらなかったかを比較する
4. 責めない・どちらが正しいという判断はしない。ズレを「対話のきっかけ」として提示する
5. 条件は具体的に（「広さ」ではなく「リビングの開放感」のように）

## 出力形式（JSONのみ。前後の説明文不要）
{
  "agreements": [
    {
      "condition": "一致している条件（12文字以内）",
      "description": "具体的にどのログから確認できるか（1文）"
    }
  ],
  "gaps": [
    {
      "topic": "ズレているテーマ（12文字以内）",
      "my_tendency": "私の傾向（1文）",
      "partner_tendency": "パートナーの傾向（1文）",
      "suggestion": "二人で話し合うと良いポイント（1文）"
    }
  ],
  "insight": "二人の家探しの全体像を語りかけで2〜3文。前向きなトーンで。"
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
    type: 'alignment',
    result: analysisResult,
  })

  return NextResponse.json({ result: analysisResult })
}

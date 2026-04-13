import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { PropertyLog } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { projectId, userId } = body as { projectId: string; userId: string }

  if (!projectId || userId !== user.id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify membership
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get logs
  const { data: logsRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  const logs = (logsRaw ?? []) as PropertyLog[]

  if (logs.length < 5) {
    return NextResponse.json({ error: 'ログが5件以上必要です' }, { status: 422 })
  }

  // Format logs for AI
  const logsText = logs.map((l, i) => {
    const goodTags = l.tags_good.length ? `良かった点: ${l.tags_good.join('、')}` : ''
    const badTags  = l.tags_bad.length  ? `気になった点: ${l.tags_bad.join('、')}` : ''
    const memo     = l.memo ? `メモ: ${l.memo}` : ''
    return [
      `【物件${i + 1}】${l.title ?? '名称未設定'} / スコア: ${l.score}/5`,
      goodTags, badTags, memo
    ].filter(Boolean).join('\n')
  }).join('\n\n')

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `あなたは家探しのカウンセラーです。以下はユーザーが記録した物件への反応ログです。

${logsText}

このデータを分析して、このユーザーが「本当に重視している条件」TOP5を優先度順に教えてください。

重要な分析の視点：
- ユーザーが「言っている」優先度ではなく、高スコアの物件に共通する特徴から「やっている」優先度を見つける
- 低スコアの物件に共通する不満点から、実は重視している条件を逆算する
- 温かく、背中を押すようなトーンで

以下のJSON形式のみで回答してください（説明は不要）：
{
  "priorities": [
    {
      "rank": 1,
      "condition": "条件名（短く）",
      "reason": "なぜこれが重要だと判断したか（1〜2文、具体的に）",
      "matchRate": 85
    }
  ],
  "insight": "全体的な洞察を1〜2文で。ユーザーへの語りかけ形式で（例：「あなたは〜を大切にしているようです」）"
}`,
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Parse JSON from response
  let analysisResult
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON not found')
    analysisResult = JSON.parse(jsonMatch[0])
    analysisResult.generatedAt = new Date().toISOString()
  } catch {
    return NextResponse.json({ error: 'AI応答の解析に失敗しました' }, { status: 500 })
  }

  // Save to analyses table
  await supabase.from('analyses').insert({
    project_id: projectId,
    user_id: user.id,
    type: 'priority',
    result: analysisResult,
  })

  return NextResponse.json({ result: analysisResult })
}

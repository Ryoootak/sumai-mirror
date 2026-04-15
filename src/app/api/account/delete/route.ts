import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyDeleteToken(token: string): string | null {
  try {
    const [userId, timestamp, signature] = token.split(':')
    if (!userId || !timestamp || !signature) return null

    // 5分以内のトークンのみ有効
    const now = Math.floor(Date.now() / 60000)
    const diff = Math.abs(now - parseInt(timestamp))
    if (diff > 5) return null

    const expected = crypto
      .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!)
      .update(`${userId}:${timestamp}`)
      .digest('hex')

    if (signature !== expected) return null
    return userId
  } catch {
    return null
  }
}

export async function DELETE(request: NextRequest) {
  console.log('[DELETE /api/account/delete] start')

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }

  const userId = verifyDeleteToken(body.token ?? '')
  if (!userId) {
    console.error('[DELETE /api/account/delete] invalid or expired token')
    return NextResponse.json({ error: 'トークンが無効または期限切れです。ページを再読み込みしてください。' }, { status: 401 })
  }

  console.log('[DELETE /api/account/delete] verified user:', userId)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    console.error('[DELETE /api/account/delete] deleteUser error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[DELETE /api/account/delete] success:', userId)
  return NextResponse.json({ ok: true })
}

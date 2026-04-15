import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Account delete failed: missing env vars')
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data: { user }, error: authError } = await admin.auth.getUser(token)

  if (authError || !user) {
    console.error('Account delete failed: invalid token', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('Account delete failed: deleteUser error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

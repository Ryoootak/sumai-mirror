import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: { user }, error: authError } = await admin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id, false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: deletedUser, error: verifyError } = await admin.auth.admin.getUserById(user.id)
  if (!verifyError && deletedUser?.user) {
    return NextResponse.json({ error: 'アカウント削除が完了していません' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  console.log('[DELETE /api/account/delete] start')

  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[DELETE /api/account/delete] unauthorized:', userError?.message)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[DELETE /api/account/delete] user:', user.id)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[DELETE /api/account/delete] missing env vars')
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[DELETE /api/account/delete] deleteUser error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[DELETE /api/account/delete] success:', user.id)
  return NextResponse.json({ ok: true })
}

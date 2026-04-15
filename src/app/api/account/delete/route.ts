import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function DELETE() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Account delete failed: NEXT_PUBLIC_SUPABASE_URL is missing')
    return NextResponse.json({ error: 'Supabase URL が設定されていません' }, { status: 500 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Account delete failed: SUPABASE_SERVICE_ROLE_KEY is missing')
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY が設定されていません' }, { status: 500 })
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Account delete failed: unauthorized', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error } = await admin.auth.admin.deleteUser(user.id, false)

  if (error) {
    console.error('Account delete failed: admin deleteUser error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: deletedUser, error: verifyError } = await admin.auth.admin.getUserById(user.id)
  if (!verifyError && deletedUser?.user) {
    console.error('Account delete failed: user still exists after delete', {
      userId: user.id,
      deletedUser,
    })
    return NextResponse.json({ error: 'アカウント削除が完了していません' }, { status: 500 })
  }

  if (verifyError) {
    console.info('Account delete verification result', {
      userId: user.id,
      verifyError,
    })
  }

  return NextResponse.json({ ok: true })
}

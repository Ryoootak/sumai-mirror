'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function deleteAccount(): Promise<{ error?: string }> {
  console.log('[deleteAccount] start')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[deleteAccount] missing NEXT_PUBLIC_SUPABASE_URL')
    return { error: 'サーバー設定エラー (URL)' }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[deleteAccount] missing SUPABASE_SERVICE_ROLE_KEY')
    return { error: 'サーバー設定エラー (KEY)' }
  }

  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('[deleteAccount] getUser error:', userError.message)
    return { error: 'セッションエラー: ' + userError.message }
  }
  if (!user) {
    console.error('[deleteAccount] no user found')
    return { error: 'ログインセッションが見つかりません' }
  }

  console.log('[deleteAccount] user found:', user.id)

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  console.log('[deleteAccount] calling deleteUser...')
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[deleteAccount] deleteUser failed:', error.message)
    return { error: error.message }
  }

  console.log('[deleteAccount] deleted successfully:', user.id)
  return {}
}

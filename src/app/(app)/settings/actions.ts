'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function deleteAccount(): Promise<{ error?: string }> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[deleteAccount] NEXT_PUBLIC_SUPABASE_URL is not set')
      return { error: 'サーバー設定エラー (URL)' }
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[deleteAccount] SUPABASE_SERVICE_ROLE_KEY is not set')
      return { error: 'サーバー設定エラー (KEY)' }
    }

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('[deleteAccount] getUser error:', userError)
      return { error: 'セッション取得エラー: ' + userError.message }
    }
    if (!user) {
      console.error('[deleteAccount] no user in session')
      return { error: 'ログインセッションが見つかりません' }
    }

    console.log('[deleteAccount] deleting user:', user.id)

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('[deleteAccount] deleteUser error:', error)
      return { error: error.message }
    }

    console.log('[deleteAccount] user deleted successfully:', user.id)
    return {}
  } catch (e) {
    console.error('[deleteAccount] unexpected error:', e)
    return { error: e instanceof Error ? e.message : '削除に失敗しました' }
  }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function deleteAccount(): Promise<{ error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'ログインセッションが見つかりません' }
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      return { error: error.message }
    }

    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : '削除に失敗しました' }
  }
}

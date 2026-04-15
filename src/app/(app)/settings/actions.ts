'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function deleteAccount(): Promise<{ error?: string }> {
  let errorMessage: string | undefined

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { error: 'サーバー設定エラー' }
    }

    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'ログインセッションが見つかりません' }
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )

    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      errorMessage = error.message
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : '削除に失敗しました'
  }

  if (errorMessage) {
    return { error: errorMessage }
  }

  // 削除成功 — try/catch の外で redirect を呼ぶことで
  // Next.js がページ再レンダリングを試みずそのままリダイレクト
  redirect('/login')
}

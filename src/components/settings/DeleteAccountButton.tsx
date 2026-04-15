'use client'

import { useState } from 'react'
import { LockKeyhole, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DeleteAccountButton({
  deleteToken,
  email,
}: {
  deleteToken: string
  email: string
}) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setOpen(false)
    setPassword('')
    setError(null)
  }

  const handleDelete = async () => {
    if (!password) {
      setError('パスワードを入力してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // パスワードを検証
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('パスワードが正しくありません')
        return
      }

      // 削除実行
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: deleteToken }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? '削除に失敗しました')
        return
      }

      window.location.href = '/login'
    } catch {
      setError('削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-5 py-4 text-rose-400 transition hover:bg-rose-50"
      >
        <Trash2 className="size-4" strokeWidth={1.5} />
        <span className="font-medium">アカウントを削除</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl mb-20">
            <h2 className="text-lg font-bold text-stone-900">アカウントを削除しますか？</h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              すべての物件ログ・分析データが完全に削除されます。この操作は取り消せません。
            </p>

            <div className="mt-4">
              <label className="block text-[13px] font-medium text-stone-700 mb-1.5">
                パスワードを入力して確認
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 transition focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-200">
                <LockKeyhole className="size-4 text-stone-400 shrink-0" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-[15px] text-stone-800 placeholder:text-stone-300 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-rose-500">{error}</p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {loading ? '確認中...' : '削除する'}
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="w-full rounded-2xl border border-stone-200 py-3.5 text-sm font-semibold text-stone-500 transition hover:bg-stone-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '@/app/(app)/settings/actions'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await deleteAccount()
      // redirect() が Server Action 内で呼ばれた場合 result は undefined になる
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // 成功時は Server Action 内の redirect('/login') が画面遷移を行う
    } catch {
      setError('削除に失敗しました')
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

            {error && (
              <p className="mt-3 text-sm text-rose-500">{error}</p>
            )}

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                {loading ? '削除中...' : '削除する'}
              </button>
              <button
                onClick={() => { setOpen(false); setError(null) }}
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

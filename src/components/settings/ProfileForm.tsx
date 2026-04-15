'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialName: string
  currentEmail: string
}

export function ProfileForm({ userId, initialName, currentEmail }: ProfileFormProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(currentEmail)
  const [displayName, setDisplayName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    try {
      if (trimmedName !== displayName) {
        const { error } = await supabase
          .from('users_profile')
          .update({ name: trimmedName })
          .eq('id', userId)
        if (error) throw new Error(error.message)
        setDisplayName(trimmedName)
      }

      if (trimmedEmail !== currentEmail) {
        const { error } = await supabase.auth.updateUser({ email: trimmedEmail })
        if (error) throw new Error(error.message)
        setMessage({
          type: 'success',
          text: `${trimmedEmail} に確認メールを送信しました。`,
        })
        setLoading(false)
        setEditing(false)
        return
      }

      setEditing(false)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '保存に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(displayName)
    setEmail(currentEmail)
    setMessage(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-600">
            {displayName?.slice(0, 1) ?? currentEmail?.slice(0, 1) ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-stone-800">{displayName || '名前未設定'}</p>
            <p className="text-sm text-stone-400">{currentEmail}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition"
          >
            変更
          </button>
          {message && (
            <p className={`text-xs ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-stone-600">名前</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-3 focus:ring-amber-400/20"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-stone-600">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-3 focus:ring-amber-400/20"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-rose-500' : 'text-emerald-600'}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-50 disabled:opacity-60"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
  userId: string
  initialName: string
  currentEmail: string
}

export function ProfileForm({ userId, initialName, currentEmail }: ProfileFormProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(currentEmail)
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
      // 名前の更新
      if (trimmedName !== initialName) {
        const { error } = await supabase
          .from('users_profile')
          .update({ name: trimmedName })
          .eq('id', userId)
        if (error) throw new Error(error.message)
      }

      // メールアドレスの更新
      if (trimmedEmail !== currentEmail) {
        const { error } = await supabase.auth.updateUser({ email: trimmedEmail })
        if (error) throw new Error(error.message)
        setMessage({
          type: 'success',
          text: `${trimmedEmail} に確認メールを送信しました。リンクを開くと変更が完了します。`,
        })
        setLoading(false)
        return
      }

      setMessage({ type: 'success', text: '保存しました。' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '保存に失敗しました' })
    } finally {
      setLoading(false)
    }
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

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}

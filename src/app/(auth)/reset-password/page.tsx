'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('パスワードは8文字以上にしてください')
      return
    }
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。')
      setLoading(false)
      return
    }
    router.push('/log')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md space-y-5 sm:space-y-8">
      <div className="text-center space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,251,245,0.95),rgba(255,255,255,0.98))] px-4 pb-4 pt-5 shadow-[0_18px_50px_-30px_rgba(120,74,29,0.35)] sm:rounded-[2rem] sm:px-6 sm:pb-6 sm:pt-8">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-20 rounded-full bg-amber-200/30 blur-3xl sm:h-24" />
          <div className="relative mx-auto flex max-w-[150px] justify-center sm:max-w-[220px]">
            <Image
              src="/images/home_mirror.png"
              alt="SUMAI MIRROR"
              width={220}
              height={150}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="relative mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/80 sm:text-[11px]">
              New password
            </p>
            <h1
              className="text-[1.85rem] font-bold tracking-tight text-stone-800 sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              新しいパスワード
            </h1>
            <p className="mx-auto max-w-[15rem] text-[13px] leading-relaxed text-stone-500 sm:max-w-xs sm:text-sm">
              新しいパスワードを入力してください。
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-stone-700 sm:text-sm">新しいパスワード（8文字以上）</label>
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white px-3.5 py-3 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20 sm:rounded-2xl sm:px-4 sm:py-3.5">
            <LockKeyhole className="size-4 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full bg-transparent text-[15px] text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-stone-700 sm:text-sm">パスワードの確認</label>
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white px-3.5 py-3 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20 sm:rounded-2xl sm:px-4 sm:py-3.5">
            <LockKeyhole className="size-4 text-stone-400" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full bg-transparent text-[15px] text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[1.15rem] bg-amber-500 text-[15px] font-semibold text-white shadow-[0_12px_30px_-18px_rgba(217,119,6,0.8)] transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:text-base"
        >
          <ArrowRight className="size-4" />
          {loading ? '更新中...' : 'パスワードを更新する'}
        </Button>
      </form>
    </div>
  )
}

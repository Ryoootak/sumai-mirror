'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError('メールの送信に失敗しました。もう一度お試しください。')
      setLoading(false)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center space-y-4 sm:space-y-5">
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
              Check your inbox
            </p>
            <h2
              className="text-xl font-bold text-stone-800 sm:text-2xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              メールを送信しました
            </h2>
            <p className="mx-auto max-w-[15rem] text-[13px] leading-relaxed text-stone-500 sm:max-w-xs sm:text-sm">
              <span className="font-medium text-stone-700">{email}</span> にリセット用のリンクを送りました。
              メールが届かない場合は迷惑メールもご確認ください。
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-block text-[13px] font-semibold text-amber-600 underline underline-offset-4 sm:text-sm"
        >
          ログインページへ戻る
        </Link>
      </div>
    )
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
              Password reset
            </p>
            <h1
              className="text-[1.85rem] font-bold tracking-tight text-stone-800 sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              パスワードをリセット
            </h1>
            <p className="mx-auto max-w-[15rem] text-[13px] leading-relaxed text-stone-500 sm:max-w-xs sm:text-sm">
              登録済みのメールアドレスを入力してください。リセット用のリンクをお送りします。
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium text-stone-700 sm:text-sm">メールアドレス</label>
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white px-3.5 py-3 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20 sm:rounded-2xl sm:px-4 sm:py-3.5">
            <Mail className="size-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-transparent text-[15px] text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-[#efcfb0] bg-[#fbf1e5] px-4 py-3 text-sm text-[#b65e2a]">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-[1.15rem] bg-amber-500 text-[15px] font-semibold text-white shadow-[0_12px_30px_-18px_rgba(217,119,6,0.8)] transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60 sm:h-12 sm:rounded-2xl sm:text-base"
        >
          <ArrowRight className="size-4" />
          {loading ? '送信中...' : 'リセットメールを送信'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-stone-500 sm:text-sm">
        <Link
          href="/login"
          className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-4"
        >
          ログインページへ戻る
        </Link>
      </p>
    </div>
  )
}

'use client'

import { Suspense, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { sanitizeAuthRedirectPath } from '@/lib/auth-redirect'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = useMemo(() => sanitizeAuthRedirectPath(searchParams.get('next')), [searchParams])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md space-y-5 sm:space-y-8">
      <div className="space-y-4 text-center sm:space-y-5">
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/80 sm:text-[11px] sm:tracking-[0.24em]">
              Property candidates
            </p>
            <h1
              className="text-[1.85rem] font-bold tracking-tight text-stone-800 sm:text-3xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              SUMAI MIRROR
            </h1>
            <p className="mx-auto max-w-[15rem] text-[13px] leading-relaxed text-stone-500 sm:max-w-xs sm:text-sm">
              気になる物件候補を整理して、重視している条件を見つけやすくします。一人でも、あとから共有でも使えます。
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-medium text-stone-700 sm:text-sm">パスワード</label>
            <Link href="/forgot-password" className="text-[12px] text-amber-600 hover:text-amber-700 underline underline-offset-4">
              パスワードを忘れた方
            </Link>
          </div>
          <div className="flex items-center gap-3 rounded-[1.15rem] border border-stone-200 bg-white px-3.5 py-3 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20 sm:rounded-2xl sm:px-4 sm:py-3.5">
            <LockKeyhole className="size-4 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>

      <p className="text-center text-[13px] text-stone-500 sm:text-sm">
        アカウントがない方は{' '}
        <Link
          href={next === '/log' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-4"
        >
          新規登録
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md" />}>
      <LoginPageContent />
    </Suspense>
  )
}

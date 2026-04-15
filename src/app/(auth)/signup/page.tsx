'use client'

import { Suspense, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { sanitizeAuthRedirectPath } from '@/lib/auth-redirect'

function SignupPageContent() {
  const searchParams = useSearchParams()
  const next = useMemo(() => sanitizeAuthRedirectPath(searchParams.get('next')), [searchParams])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('パスワードは8文字以上にしてください'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,251,245,0.95),rgba(255,255,255,0.98))] px-6 pb-6 pt-8 shadow-[0_18px_50px_-30px_rgba(120,74,29,0.35)]">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="relative mx-auto flex max-w-[220px] justify-center">
            <Image
              src="/images/home_mirror.png"
              alt="SUMAI MIRROR"
              width={220}
              height={150}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="relative mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              Welcome aboard
            </p>
            <h2
              className="text-2xl font-bold text-stone-800"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              確認メールを送信しました
            </h2>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-stone-500">
              <span className="font-medium text-stone-700">{email}</span> に届いたリンクを開くと、
              すぐに記録を始められます。
            </p>
          </div>
        </div>
        <div>
          <h2
            className="text-base font-semibold text-stone-700"
          >
            メールが見つからない場合は迷惑メールも確認してください
          </h2>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-amber-600 underline underline-offset-4"
        >
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,251,245,0.95),rgba(255,255,255,0.98))] px-6 pb-6 pt-8 shadow-[0_18px_50px_-30px_rgba(120,74,29,0.35)]">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="relative mx-auto flex max-w-[220px] justify-center">
            <Image
              src="/images/home_mirror.png"
              alt="SUMAI MIRROR"
              width={220}
              height={150}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="relative mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              Create account
            </p>
            <h1
              className="text-3xl font-bold tracking-tight text-stone-800"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              SUMAI MIRROR
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-stone-500">
              二人の家探しを、静かに整った記録から始めましょう。
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">お名前</label>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20">
            <UserRound className="size-4 text-stone-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="山田 太郎"
              className="w-full bg-transparent text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">メールアドレス</label>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20">
            <Mail className="size-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-transparent text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">パスワード（8文字以上）</label>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20">
            <LockKeyhole className="size-4 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-transparent text-stone-800 placeholder:text-stone-300 outline-none"
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
          className="h-12 w-full rounded-2xl bg-amber-500 text-base font-semibold text-white shadow-[0_12px_30px_-18px_rgba(217,119,6,0.8)] transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          <ArrowRight className="size-4" />
          {loading ? '登録中...' : 'アカウントを作成'}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
        すでにアカウントをお持ちの方は{' '}
        <Link
          href={next === '/log' ? '/login' : `/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-4"
        >
          ログイン
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm" />}>
      <SignupPageContent />
    </Suspense>
  )
}

'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SignupPageContent() {
  const searchParams = useSearchParams()
  const next = useMemo(() => searchParams.get('next') || '/log', [searchParams])
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
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-100 text-3xl">
          📬
        </div>
        <div>
          <h2
            className="text-xl font-bold text-stone-800"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            確認メールを送信しました
          </h2>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            <span className="font-medium text-stone-700">{email}</span> に届いたリンクをクリックして<br />登録を完了してください。
          </p>
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
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-2">
          <span className="text-2xl">🏠</span>
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          SUMAI MIRROR
        </h1>
        <p className="text-sm text-stone-500">一緒に家探しを始めよう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">お名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="山田 太郎"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">パスワード（8文字以上）</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-amber-500 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? '登録中...' : 'アカウントを作成'}
        </button>
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

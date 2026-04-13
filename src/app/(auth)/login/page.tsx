'use client'

import { Suspense, useMemo, useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = useMemo(() => searchParams.get('next') || '/log', [searchParams])
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
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-2 shadow-sm">
          <span className="text-2xl">🏠</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          <ShieldCheck className="size-3.5" />
          Secure sign in
        </div>
        <h1
          className="text-2xl font-bold tracking-tight text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          SUMAI MIRROR
        </h1>
        <p className="text-sm text-stone-500">家探しの「好み」を映す鏡</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">メールアドレス</label>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20">
            <Mail className="size-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full bg-transparent text-stone-800 placeholder:text-stone-300 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">パスワード</label>
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition focus-within:border-amber-400 focus-within:ring-3 focus-within:ring-amber-400/20">
            <LockKeyhole className="size-4 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
          className="h-12 w-full rounded-2xl bg-amber-500 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
        >
          <ArrowRight className="size-4" />
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500">
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
    <Suspense fallback={<div className="w-full max-w-sm" />}>
      <LoginPageContent />
    </Suspense>
  )
}

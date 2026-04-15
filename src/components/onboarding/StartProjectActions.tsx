'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Link2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StartProjectActions() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingMode, setPendingMode] = useState<'solo' | 'pair' | null>(null)

  const startProject = (mode: 'solo' | 'pair') => {
    setPendingMode(mode)
    setError(null)

    startTransition(async () => {
      const response = await fetch('/api/onboarding/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })

      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) {
        setError(data.error ?? '開始に失敗しました')
        setPendingMode(null)
        return
      }

      router.push('/log')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={() => startProject('pair')}
        disabled={isPending}
        className="h-12 w-full justify-between rounded-2xl bg-stone-900 px-5 text-left text-white hover:bg-stone-800"
      >
        <span className="flex items-center gap-3">
          <Users className="size-4" />
          {pendingMode === 'pair' ? '共有用の候補一覧を準備中...' : 'パートナーと共有して始める'}
        </span>
        <ArrowRight className="size-4" />
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => startProject('solo')}
        disabled={isPending}
        className="h-12 w-full justify-between rounded-2xl border-stone-200 px-5 text-left text-stone-700"
      >
        <span className="flex items-center gap-3">
          <Link2 className="size-4" />
          {pendingMode === 'solo' ? '候補一覧を準備中...' : 'ひとりで始める'}
        </span>
        <ArrowRight className="size-4" />
      </Button>

      {error && (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}

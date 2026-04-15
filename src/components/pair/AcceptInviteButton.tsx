'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightLeft, Combine, Link2 } from 'lucide-react'

type JoinMode = 'direct' | 'switch_active' | 'merge_logs'

interface AcceptInviteButtonProps {
  projectId: string
  mode?: JoinMode
  label?: string
}

export function AcceptInviteButton({
  projectId,
  mode = 'direct',
  label,
}: AcceptInviteButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAccept = () => {
    setError(null)

    startTransition(async () => {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, mode }),
      })

      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? '招待の参加に失敗しました')
        return
      }

      router.push('/log')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAccept}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mode === 'merge_logs' ? <Combine className="mr-2 size-4" /> : mode === 'switch_active' ? <ArrowRightLeft className="mr-2 size-4" /> : <Link2 className="mr-2 size-4" />}
        {isPending ? '参加中...' : (label ?? 'このペアに参加する')}
      </button>
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  )
}

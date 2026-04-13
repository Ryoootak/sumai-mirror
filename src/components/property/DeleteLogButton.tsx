'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function DeleteLogButton({ logId }: { logId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, start] = useTransition()

  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('property_logs').delete().eq('id', logId)
    start(() => {
      router.push('/log')
      router.refresh()
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => setConfirm(false)} className="text-sm text-stone-400">キャンセル</button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-xl bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white"
        >
          削除する
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-200 bg-white text-stone-400 hover:text-rose-500 transition"
    >
      <Trash2 className="size-4" strokeWidth={1.5} />
    </button>
  )
}

'use client'

import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'

export function CopyInviteButton({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = `${location.origin}/invite/${projectId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-stone-800 active:scale-95 transition-all"
    >
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? 'コピーしました！' : '招待リンクをコピー'}
    </button>
  )
}

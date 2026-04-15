'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { PartnerReaction, PartnerReactionFormData } from '@/types'

const SCORE_OPTIONS = [
  { value: 3, label: 'かなりいい', sub: 'かなり前向き', activeClass: 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200' },
  { value: 2, label: 'いいな',  sub: 'いい感じ',       activeClass: 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm' },
  { value: 1, label: 'ありかな', sub: '悪くない',       activeClass: 'border-stone-300 bg-stone-50 text-stone-600 shadow-sm' },
] as const

const REACTION_OPTIONS: { value: PartnerReaction; label: string; activeClass: string }[] = [
  { value: 'best',    label: 'かなりいい', activeClass: 'bg-amber-500 text-white border-amber-500' },
  { value: 'good',    label: 'いいな',  activeClass: 'bg-amber-300 text-amber-900 border-amber-300' },
  { value: 'okay',    label: 'ありかな', activeClass: 'bg-stone-200 text-stone-700 border-stone-300' },
  { value: 'unknown', label: 'まだ',    activeClass: 'bg-stone-100 text-stone-400 border-stone-200' },
]

interface PartnerReactionFormProps {
  logId: string
  initialData?: {
    partner_score: number | null
    partner_reaction: PartnerReaction
    partner_comment: string | null
  }
}

export function PartnerReactionForm({ logId, initialData }: PartnerReactionFormProps) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [form, setForm] = useState<PartnerReactionFormData>({
    partner_score: initialData?.partner_score ?? 0,
    partner_reaction: initialData?.partner_reaction ?? 'unknown',
    partner_comment: initialData?.partner_comment ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof PartnerReactionFormData>(k: K, v: PartnerReactionFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.partner_score === 0) { setError('スコアを選択してください'); return }
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('property_logs')
      .update({
        partner_score: form.partner_score,
        partner_reaction: form.partner_reaction,
        partner_comment: form.partner_comment || null,
      })
      .eq('id', logId)

    if (updateError) { setError(updateError.message); return }

    setSaved(true)
    start(() => {
      router.refresh()
    })
  }

  if (saved) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center">
        <p className="text-sm font-semibold text-[#9a5b19]">反応を保存しました</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* スコア */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-stone-700">
          自分のスコア <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3" role="radiogroup">
          {SCORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('partner_score', opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border-2 py-4 transition-all duration-150 active:scale-95',
                form.partner_score === opt.value
                  ? opt.activeClass
                  : 'border-stone-200 bg-white hover:border-stone-300'
              )}
            >
              <span className={cn('text-base font-bold', form.partner_score === opt.value ? '' : 'text-stone-400')}>
                {opt.label}
              </span>
              <span className={cn('text-[10px]', form.partner_score === opt.value ? 'opacity-80' : 'text-stone-300')}>
                {opt.sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 一言反応 */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-stone-700">一言反応</label>
        <div className="grid grid-cols-4 gap-2" role="radiogroup">
          {REACTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('partner_reaction', opt.value)}
              className={cn(
                'rounded-2xl border-2 py-3 text-sm font-bold transition-all active:scale-95',
                form.partner_reaction === opt.value ? opt.activeClass : 'border-stone-200 bg-white text-stone-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* コメント */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-stone-700">
          コメント <span className="font-normal text-stone-400">（任意）</span>
        </label>
        <textarea
          value={form.partner_comment}
          onChange={(e) => set('partner_comment', e.target.value)}
          rows={2}
          placeholder="気になったこと、感想など..."
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition resize-none focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-amber-500 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? '保存中...' : '反応を保存する'}
      </button>
    </form>
  )
}

'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { OgpData, PartnerReaction, PropertyLogFormData } from '@/types'

// ── Constants ──────────────────────────────────────────────

const TAGS_GOOD = ['日当たり', '広さ', '収納', '立地', '価格', 'デザイン', '天井高', '設備', '静けさ', '眺望'] as const
const TAGS_BAD  = ['駅から遠い', '価格が高い', '収納が少ない', '日当たり弱い', '狭い', '古い', '騒音', '管理費'] as const

const PARTNER_OPTIONS: { value: PartnerReaction; label: string; desc: string; activeClass: string }[] = [
  { value: 'great',   label: '◎', desc: 'すごくいい', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'good',    label: '○', desc: 'いい',       activeClass: 'bg-sky-500 text-white border-sky-500' },
  { value: 'neutral', label: '△', desc: '微妙',       activeClass: 'bg-amber-400 text-white border-amber-400' },
  { value: 'bad',     label: '×', desc: 'ダメ',       activeClass: 'bg-rose-500 text-white border-rose-500' },
  { value: 'unknown', label: '―', desc: '未確認',     activeClass: 'bg-stone-400 text-white border-stone-400' },
]

// ── Sub-components ─────────────────────────────────────────

function StarScore({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-3" role="radiogroup" aria-label="スコア">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          onClick={() => onChange(s)}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-3xl transition-all duration-150 active:scale-90',
            s <= value
              ? 'border-amber-400 bg-amber-400 text-white shadow-md shadow-amber-200'
              : 'border-stone-200 bg-white text-stone-200 hover:border-amber-200 hover:text-amber-200'
          )}
          aria-label={`${s}点`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function TagPills({
  tags,
  selected,
  onChange,
  variant,
}: {
  tags: readonly string[]
  selected: string[]
  onChange: (v: string[]) => void
  variant: 'good' | 'bad'
}) {
  const toggle = (tag: string) =>
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])

  const activeClass = variant === 'good'
    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
    : 'bg-rose-500 text-white border-rose-500 shadow-sm'
  const inactiveClass = 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-95',
            selected.includes(tag) ? activeClass : inactiveClass
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}

// ── OGP Hook ───────────────────────────────────────────────

function useOgp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch_ = useCallback(async (url: string): Promise<OgpData | null> => {
    if (!url) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('取得失敗')
      return await res.json() as OgpData
    } catch {
      setError('OGP取得に失敗しました（手動で入力できます）')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetch_, loading, error }
}

// ── Main Form ──────────────────────────────────────────────

const DEFAULT: PropertyLogFormData = {
  url: '',
  title: '',
  price: '',
  score: 0,
  tags_good: [],
  tags_bad: [],
  memo: '',
  partner_reaction: 'unknown',
}

export function PropertyLogForm({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [form, setForm] = useState<PropertyLogFormData>(DEFAULT)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { fetch_, loading: ogpLoading, error: ogpError } = useOgp()

  const set = <K extends keyof PropertyLogFormData>(k: K, v: PropertyLogFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleUrlBlur = async () => {
    if (!form.url) return
    const data = await fetch_(form.url)
    if (data) {
      if (data.title && !form.title) set('title', data.title)
      if (data.price && !form.price) set('price', data.price)
    }
  }

  const addCustomTag = (field: 'tags_good' | 'tags_bad', value: string) => {
    const val = value.trim()
    if (!val || form[field].includes(val)) return
    set(field, [...form[field], val])
  }

  const removeTag = (field: 'tags_good' | 'tags_bad', tag: string) =>
    set(field, form[field].filter((t) => t !== tag))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.score === 0) { setSubmitError('スコアを選択してください'); return }
    setSubmitError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('property_logs').insert({
      project_id: projectId,
      user_id: user.id,
      url: form.url || null,
      title: form.title || null,
      price: form.price || null,
      score: form.score,
      tags_good: form.tags_good,
      tags_bad: form.tags_bad,
      memo: form.memo || null,
      partner_reaction: form.partner_reaction,
    })

    if (error) { setSubmitError(error.message); return }

    start(() => {
      router.push('/log')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">

      {/* URL */}
      <section className="space-y-3">
        <label className="block text-sm font-semibold text-stone-700">
          物件URL <span className="font-normal text-stone-400">（貼るだけで自動入力）</span>
        </label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => set('url', e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://suumo.jp/..."
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
        />
        {ogpLoading && <p className="text-sm text-amber-600 flex items-center gap-1.5">⏳ 物件情報を取得中...</p>}
        {ogpError && <p className="text-sm text-stone-400">{ogpError}</p>}
      </section>

      {/* Title & Price */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-stone-700">物件名</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="〇〇マンション 3LDK"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-stone-700">価格</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="4,500万円"
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>
      </section>

      {/* Score — most important UI */}
      <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700">
            直感スコア <span className="text-rose-400">*</span>
          </label>
          <p className="text-xs text-stone-400 mt-0.5">この物件、全体的にどうでしたか？</p>
        </div>
        <StarScore value={form.score} onChange={(v) => set('score', v)} />
        {form.score > 0 && (
          <p className="text-sm font-medium text-amber-600">
            {['', '気になる点が多い', 'まずまず', 'いい感じ', 'かなりいい！', '最高！ぜひ検討したい'][form.score]}
          </p>
        )}
      </section>

      {/* Good tags */}
      <section className="space-y-3">
        <label className="block text-sm font-semibold text-stone-700">良かった点</label>
        <TagPills
          tags={TAGS_GOOD}
          selected={form.tags_good}
          onChange={(v) => set('tags_good', v)}
          variant="good"
        />
        <input
          type="text"
          placeholder="その他を追加（Enterで確定）"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustomTag('tags_good', e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
        />
        {form.tags_good.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.tags_good.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                {t}
                <button type="button" onClick={() => removeTag('tags_good', t)} className="text-amber-400 hover:text-amber-600 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Bad tags */}
      <section className="space-y-3">
        <label className="block text-sm font-semibold text-stone-700">気になった点</label>
        <TagPills
          tags={TAGS_BAD}
          selected={form.tags_bad}
          onChange={(v) => set('tags_bad', v)}
          variant="bad"
        />
        <input
          type="text"
          placeholder="その他を追加（Enterで確定）"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustomTag('tags_bad', e.currentTarget.value)
              e.currentTarget.value = ''
            }
          }}
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
        />
        {form.tags_bad.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.tags_bad.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                {t}
                <button type="button" onClick={() => removeTag('tags_bad', t)} className="text-rose-400 hover:text-rose-600 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Memo */}
      <section className="space-y-2">
        <label className="block text-sm font-semibold text-stone-700">
          一言メモ <span className="font-normal text-stone-400">（任意）</span>
        </label>
        <textarea
          value={form.memo}
          onChange={(e) => set('memo', e.target.value)}
          rows={3}
          placeholder="内覧の感想、気になったこと、担当者の印象など..."
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-stone-800 placeholder:text-stone-300 outline-none transition resize-none focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
        />
      </section>

      {/* Partner reaction */}
      <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-3">
        <label className="block text-sm font-semibold text-stone-700">
          パートナーの反応 <span className="font-normal text-stone-400">（任意）</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {PARTNER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('partner_reaction', opt.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-lg font-bold transition-all active:scale-95',
                form.partner_reaction === opt.value
                  ? opt.activeClass
                  : 'border-stone-200 bg-white text-stone-300'
              )}
            >
              {opt.label}
              <span className="text-[9px] font-normal leading-none opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {submitError && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || ogpLoading}
        className="w-full rounded-2xl bg-amber-500 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? '保存中...' : '記録する'}
      </button>
    </form>
  )
}

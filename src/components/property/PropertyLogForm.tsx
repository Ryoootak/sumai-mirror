'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { OgpData, PropertyLog, PropertyLogFormData, PropertyType } from '@/types'

// ── タグ定義 ───────────────────────────────────────────────

const TAGS_GOOD_COMMON = [
  '日当たり・採光', '広さ・ゆとり', '駅・交通の便', '買い物・生活環境',
  '教育・学区環境', '静かな住環境', '自然・緑が多い', '治安の良さ', '価格・コスパ',
] as const

const TAGS_BAD_COMMON = [
  '駅・交通が不便', '買い物・生活環境が弱い', '学区・教育環境が不安',
  '騒音・振動', '交通量が多い', '治安が不安', '日当たりが弱い',
  '狭さが気になる', 'ハザード・水害リスク', '地盤が不安', '価格が高い',
] as const

const TAGS_GOOD_BY_TYPE: Record<PropertyType, readonly string[]> = {
  mansion: ['天井高・開放感', '眺望', '収納の充実', '設備の新しさ', 'デザイン・外観', '管理体制', '共用施設', 'セキュリティ', '築浅'],
  house:   ['庭・外構', '駐車スペース', '間取り', '収納の充実', 'デザイン・外観', '性能', '築浅'],
  land:    ['広さ・形状の良さ', '接道の良さ', '更地・即建築可', '日影が少ない', '坂・高低差なし'],
}

const TAGS_BAD_BY_TYPE: Record<PropertyType, readonly string[]> = {
  mansion: ['管理費・修繕積立が高い', '階数・向きが惜しい', '収納が少ない', '設備が古い', '管理体制が不安', '築年数が気になる'],
  house:   ['庭・外構が狭い', '駐車スペースなし', '維持費・修繕が不安', '築年数が気になる'],
  land:    ['形状が使いにくい', '接道が狭い・悪い', '用途・建築制限', '日影・斜線制限', '造成・整地が必要', '高低差・傾斜あり'],
}

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'mansion', label: 'マンション' },
  { value: 'house',   label: '戸建て' },
  { value: 'land',    label: '土地' },
]

const SCORE_OPTIONS = [
  { value: 3, label: '最高',    sub: 'ぜひ検討したい', activeClass: 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200' },
  { value: 2, label: 'いいな',  sub: 'いい感じ',       activeClass: 'border-amber-300 bg-amber-50 text-amber-700 shadow-sm' },
  { value: 1, label: 'ありかな', sub: '悪くない',      activeClass: 'border-stone-300 bg-stone-50 text-stone-600 shadow-sm' },
] as const

// ── Sub-components ─────────────────────────────────────────

function TypeSelect({ value, onChange }: { value: PropertyType | null; onChange: (v: PropertyType) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="物件タイプ">
      {PROPERTY_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-2xl border-2 py-4 transition-all duration-150 active:scale-95',
            value === opt.value
              ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-200'
              : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
          )}
        >
          <span className={cn('text-sm font-semibold', value === opt.value ? '' : 'text-stone-500')}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

function ScoreSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="評価">
      {SCORE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-2xl border-2 py-4 transition-all duration-150 active:scale-95',
            value === opt.value
              ? opt.activeClass
              : 'border-stone-200 bg-white hover:border-stone-300'
          )}
        >
          <span className={cn('text-base font-bold', value === opt.value ? '' : 'text-stone-400')}>{opt.label}</span>
          <span className={cn('text-[10px]', value === opt.value ? 'opacity-80' : 'text-stone-300')}>{opt.sub}</span>
        </button>
      ))}
    </div>
  )
}

function TagPills({
  tags, selected, onChange, variant,
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

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 active:scale-95',
            selected.includes(tag) ? activeClass : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
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
  property_type: null,
  score: 0,
  tags_good: [],
  tags_bad: [],
  memo: '',
}

interface PropertyLogFormProps {
  projectId: string
  initialData?: PropertyLog
  mode?: 'create' | 'edit'
}

export function PropertyLogForm({ projectId, initialData, mode = 'create' }: PropertyLogFormProps) {
  const router = useRouter()
  const [isPending, start] = useTransition()
  const [form, setForm] = useState<PropertyLogFormData>(
    initialData
      ? {
          url: initialData.url ?? '',
          title: initialData.title ?? '',
          price: initialData.price ?? '',
          property_type: initialData.property_type,
          score: initialData.score,
          tags_good: initialData.tags_good,
          tags_bad: initialData.tags_bad,
          memo: initialData.memo ?? '',
        }
      : DEFAULT
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { fetch_, loading: ogpLoading, error: ogpError } = useOgp()

  const set = <K extends keyof PropertyLogFormData>(k: K, v: PropertyLogFormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleTypeChange = (type: PropertyType) => {
    // タイプ変更時はタグをリセット
    setForm((p) => ({ ...p, property_type: type, tags_good: [], tags_bad: [] }))
  }

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
    if (!form.property_type) { setSubmitError('物件タイプを選択してください'); return }
    if (form.score === 0) { setSubmitError('評価を選択してください'); return }
    setSubmitError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const payload = {
      url: form.url || null,
      title: form.title || null,
      price: form.price || null,
      property_type: form.property_type,
      score: form.score,
      tags_good: form.tags_good,
      tags_bad: form.tags_bad,
      memo: form.memo || null,
    }

    let error
    if (mode === 'edit' && initialData) {
      ;({ error } = await supabase
        .from('property_logs')
        .update(payload)
        .eq('id', initialData.id)
        .eq('user_id', user.id))
    } else {
      ;({ error } = await supabase.from('property_logs').insert({
        ...payload,
        project_id: projectId,
        user_id: user.id,
      }))
    }

    if (error) { setSubmitError(error.message); return }

    const dest = mode === 'edit' && initialData ? `/log/${initialData.id}` : '/log'
    start(() => {
      router.refresh()
      router.push(dest)
    })
  }

  // タイプに応じたタグセット
  const tagsGood = form.property_type
    ? [...TAGS_GOOD_COMMON, ...TAGS_GOOD_BY_TYPE[form.property_type]]
    : [...TAGS_GOOD_COMMON]
  const tagsBad = form.property_type
    ? [...TAGS_BAD_COMMON, ...TAGS_BAD_BY_TYPE[form.property_type]]
    : [...TAGS_BAD_COMMON]

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">

      {/* 物件タイプ */}
      <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700">
            物件タイプ <span className="text-rose-400">*</span>
          </label>
          <p className="text-xs text-stone-400 mt-0.5">どんな物件を見ましたか？</p>
        </div>
        <TypeSelect value={form.property_type} onChange={handleTypeChange} />
        {form.property_type === 'land' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
            土地はポテンシャルで評価してください。建てたあとを想像しながら記録しましょう。
          </p>
        )}
      </section>

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
        {ogpLoading && <p className="text-sm text-amber-600">⏳ 物件情報を取得中...</p>}
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

      {/* Score */}
      <section className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-stone-700">
            直感評価 <span className="text-rose-400">*</span>
          </label>
          <p className="text-xs text-stone-400 mt-0.5">この物件、全体的にどうでしたか？</p>
        </div>
        <ScoreSelect value={form.score} onChange={(v) => set('score', v)} />
      </section>

      {/* Good tags */}
      <section className="space-y-3">
        <label className="block text-sm font-semibold text-stone-700">良かった点</label>
        <TagPills tags={tagsGood} selected={form.tags_good} onChange={(v) => set('tags_good', v)} variant="good" />
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
        <TagPills tags={tagsBad} selected={form.tags_bad} onChange={(v) => set('tags_bad', v)} variant="bad" />
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
        {isPending ? '保存中...' : mode === 'edit' ? '保存する' : '記録する'}
      </button>
    </form>
  )
}

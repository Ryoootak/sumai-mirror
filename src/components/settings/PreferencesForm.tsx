'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PreferencesFormProps {
  userId: string
  initialPreferences: Record<string, string>
}

type PreferenceKey = 'area' | 'budget' | 'layout' | 'must_have' | 'avoid'

const FIELDS: { key: PreferenceKey; label: string; placeholder: string }[] = [
  { key: 'area', label: '希望エリア', placeholder: '例: 中野区 / 横浜駅周辺' },
  { key: 'budget', label: '予算感', placeholder: '例: 4,500万円まで / 家賃20万円前後' },
  { key: 'layout', label: '広さ・間取り', placeholder: '例: 2LDK以上 / 60平米以上' },
  { key: 'must_have', label: '外せない条件', placeholder: '例: 駅徒歩10分以内、南向き' },
  { key: 'avoid', label: '避けたい条件', placeholder: '例: 大通り沿い、築古すぎる物件' },
]

export function PreferencesForm({ userId, initialPreferences }: PreferencesFormProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Record<PreferenceKey, string>>({
    area: initialPreferences.area ?? '',
    budget: initialPreferences.budget ?? '',
    layout: initialPreferences.layout ?? '',
    must_have: initialPreferences.must_have ?? '',
    avoid: initialPreferences.avoid ?? '',
  })

  const handleChange = (key: PreferenceKey, value: string) => {
    setSaved(false)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ preferences: form })
        .eq('id', userId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <label className="block text-sm font-medium text-stone-700">{field.label}</label>
          <textarea
            value={form[field.key]}
            onChange={(event) => handleChange(field.key, event.target.value)}
            placeholder={field.placeholder}
            rows={field.key === 'must_have' || field.key === 'avoid' ? 3 : 2}
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-400/20"
          />
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="min-h-5 text-sm">
          {error && <p className="text-rose-500">{error}</p>}
          {!error && saved && <p className="text-emerald-600">保存しました。</p>}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? '保存中...' : '条件を保存'}
        </button>
      </div>
    </form>
  )
}

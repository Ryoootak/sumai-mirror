'use client'

import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'

import type { PropertyLog, PropertyType } from '@/types'
import { cn } from '@/lib/utils'

const SCORE_LABEL: Record<number, { label: string; className: string }> = {
  3: { label: 'かなりいい', className: 'bg-amber-500 text-white' },
  2: { label: 'いいな',  className: 'bg-amber-100 text-amber-700' },
  1: { label: 'ありかな', className: 'bg-stone-100 text-stone-500' },
}

const TYPE_LABEL: Record<PropertyType, { label: string; className: string }> = {
  mansion: { label: 'マンション', className: 'bg-amber-100 text-amber-700' },
  house:   { label: '戸建て',     className: 'bg-[#efe1d1] text-[#6a5848]' },
  land:    { label: '土地',       className: 'bg-[#fbf1e2] text-[#9a5b19]' },
}

interface PropertyCardProps {
  log: PropertyLog
  creatorName?: string | null
  currentUserId?: string
}

export function PropertyCard({ log, creatorName, currentUserId }: PropertyCardProps) {
  const isMyLog = currentUserId ? log.user_id === currentUserId : false
  const score = SCORE_LABEL[log.score] ?? SCORE_LABEL[1]
  const typeInfo = log.property_type ? TYPE_LABEL[log.property_type] : null
  const dateStr = new Date(log.created_at).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  })
  const shownTags = log.tags_good.slice(0, 2)
  const extraCount = log.tags_good.length - shownTags.length

  return (
    <Link href={`/log/${log.id}`} className="group block">
      <div className="rounded-2xl border border-stone-100 bg-white px-4 py-3.5 shadow-sm transition-all duration-150 group-hover:border-amber-200 group-hover:shadow-md">
        {/* Row 1: type badge + title + score + chevron */}
        <div className="flex items-center gap-2">
          {typeInfo && (
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', typeInfo.className)}>
              {typeInfo.label}
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-stone-800">
            {log.title ?? '名称未設定の物件'}
          </p>
          <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', score.className)}>
            {score.label}
          </span>
          <ChevronRight className="size-4 shrink-0 text-stone-300 transition group-hover:text-stone-500" />
        </div>

        {/* Row 2: price · date + tags + creator */}
        <div className="mt-1.5 flex items-center gap-2">
          <p className="shrink-0 text-[12px] text-stone-400">
            {log.price ? log.price : '価格未登録'} · {dateStr}
          </p>
          {shownTags.length > 0 && (
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {shownTags.map((tag) => (
                <span
                  key={tag}
                  className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                >
                  {tag}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="shrink-0 text-[10px] text-stone-400">+{extraCount}</span>
              )}
            </div>
          )}
          {!isMyLog && creatorName && (
            <span className="ml-auto shrink-0 text-[10px] text-stone-400">{creatorName}が登録</span>
          )}
          {log.url && (
            <a
              href={log.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto shrink-0 text-stone-300 transition hover:text-amber-500"
              aria-label="物件サイトを開く"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}

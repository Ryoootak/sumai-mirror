import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { PropertyLog, PartnerReaction } from '@/types'
import { cn } from '@/lib/utils'

const PARTNER_LABEL: Record<PartnerReaction, { label: string; className: string }> = {
  great:   { label: '◎', className: 'bg-emerald-100 text-emerald-700' },
  good:    { label: '○', className: 'bg-sky-100 text-sky-700' },
  neutral: { label: '△', className: 'bg-amber-100 text-amber-700' },
  bad:     { label: '×', className: 'bg-rose-100 text-rose-700' },
  unknown: { label: '―', className: 'bg-stone-100 text-stone-400' },
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`スコア ${score}点`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={cn(
            'text-lg leading-none',
            s <= score ? 'text-amber-400' : 'text-stone-200'
          )}
        >
          ★
        </span>
      ))}
    </div>
  )
}

interface PropertyCardProps {
  log: PropertyLog
}

export function PropertyCard({ log }: PropertyCardProps) {
  const partner = PARTNER_LABEL[log.partner_reaction]
  const dateStr = new Date(log.created_at).toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/log/${log.id}`}
      className="block rounded-3xl bg-white border border-stone-100 shadow-sm p-5 hover:border-amber-200 hover:shadow-md transition-all group"
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 truncate">
            {log.title ?? '名称未設定の物件'}
          </p>
          {log.price && (
            <p className="text-sm text-stone-500 mt-0.5">{log.price}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Partner reaction */}
          <span className={cn('text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center', partner.className)}>
            {partner.label}
          </span>
          {/* External link */}
          {log.url && (
            <a
              href={log.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-stone-300 hover:text-amber-500 transition"
              aria-label="物件サイトを開く"
            >
              <ExternalLink className="size-4" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>

      {/* Score */}
      <Stars score={log.score} />

      {/* Tags */}
      {(log.tags_good.length > 0 || log.tags_bad.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {log.tags_good.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700"
            >
              {tag}
            </span>
          ))}
          {log.tags_bad.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-block rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-medium text-rose-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Memo & date */}
      <div className="mt-3 flex items-end justify-between">
        {log.memo ? (
          <p className="text-sm text-stone-400 line-clamp-1 flex-1 mr-3">{log.memo}</p>
        ) : (
          <span />
        )}
        <span className="text-xs text-stone-300 shrink-0">{dateStr}</span>
      </div>
    </Link>
  )
}

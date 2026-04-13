import Link from 'next/link'
import { ChevronRight, ExternalLink, House, MessageSquareText } from 'lucide-react'

import type { PartnerReaction, PropertyLog } from '@/types'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

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
          className={cn('text-lg leading-none', s <= score ? 'text-amber-400' : 'text-stone-200')}
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
    <Link href={`/log/${log.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 group-hover:border-amber-200 group-hover:shadow-md">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500">
                <House className="size-3.5" strokeWidth={1.6} />
                {dateStr}
              </div>
              <p className="truncate text-[15px] font-semibold text-stone-900">
                {log.title ?? '名称未設定の物件'}
              </p>
              <p className="mt-1 text-sm text-stone-500">{log.price ?? '価格未登録'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', partner.className)}>
                {partner.label}
              </span>
              {log.url && (
                <a
                  href={log.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full p-2 text-stone-300 transition hover:bg-stone-50 hover:text-amber-500"
                  aria-label="物件サイトを開く"
                >
                  <ExternalLink className="size-4" strokeWidth={1.5} />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-brand text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">Overall score</p>
              <div className="mt-1">
                <Stars score={log.score} />
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 px-3 py-2 text-right">
              <p className="font-brand text-[11px] font-medium uppercase tracking-[0.12em] text-amber-700/70">Score</p>
              <p className="text-lg font-semibold text-amber-700">{log.score}.0</p>
            </div>
          </div>

          {(log.tags_good.length > 0 || log.tags_bad.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {log.tags_good.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800"
                >
                  {tag}
                </span>
              ))}
              {log.tags_bad.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between gap-3 border-t border-stone-100 pt-3">
            <div className="min-w-0 flex-1">
              {log.memo ? (
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <MessageSquareText className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.6} />
                  <p className="line-clamp-1">{log.memo}</p>
                </div>
              ) : (
                <p className="text-sm text-stone-400">メモなし</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-stone-400 transition group-hover:text-stone-700">
              詳細
              <ChevronRight className="size-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

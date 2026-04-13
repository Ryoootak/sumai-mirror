import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import type { PropertyLog, PartnerReaction } from '@/types'
import { cn } from '@/lib/utils'
import { DeleteLogButton } from '@/components/property/DeleteLogButton'

const PARTNER_LABEL: Record<PartnerReaction, { label: string; className: string }> = {
  great:   { label: '◎ すごくいい', className: 'bg-emerald-100 text-emerald-700' },
  good:    { label: '○ いい',       className: 'bg-sky-100 text-sky-700' },
  neutral: { label: '△ 微妙',       className: 'bg-amber-100 text-amber-700' },
  bad:     { label: '× ダメ',       className: 'bg-rose-100 text-rose-700' },
  unknown: { label: '― 未確認',     className: 'bg-stone-100 text-stone-400' },
}

interface Props {
  params: { logId: string }
}

export default async function LogDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: logRaw } = await supabase
    .from('property_logs')
    .select('*')
    .eq('id', params.logId)
    .eq('user_id', user.id)
    .single()

  if (!logRaw) notFound()
  const log = logRaw as PropertyLog

  const partner = PARTNER_LABEL[log.partner_reaction]
  const dateStr = new Date(log.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="pb-28">
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/log"
              className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-200 bg-white text-stone-500"
            >
              <ArrowLeft className="size-4" strokeWidth={1.5} />
            </Link>
            <span className="text-sm text-stone-400">{dateStr}</span>
          </div>
          <DeleteLogButton logId={log.id} />
        </div>
      </header>

      <main className="px-5 space-y-4">
        {/* Title card */}
        <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2
                className="text-lg font-bold text-stone-800"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {log.title ?? '名称未設定の物件'}
              </h2>
              {log.price && <p className="text-stone-500 mt-0.5">{log.price}</p>}
            </div>
            {log.url && (
              <a
                href={log.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-2 text-xs text-stone-500 hover:border-amber-300 hover:text-amber-600 transition shrink-0"
              >
                <ExternalLink className="size-3.5" strokeWidth={1.5} />
                物件を見る
              </a>
            )}
          </div>

          {/* Stars */}
          <div className="flex gap-1 mt-3">
            {[1,2,3,4,5].map((s) => (
              <span key={s} className={cn('text-2xl', s <= log.score ? 'text-amber-400' : 'text-stone-200')}>★</span>
            ))}
          </div>
        </div>

        {/* Good tags */}
        {log.tags_good.length > 0 && (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-500">良かった点</h3>
            <div className="flex flex-wrap gap-2">
              {log.tags_good.map((tag) => (
                <span key={tag} className="rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-sm font-medium text-amber-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bad tags */}
        {log.tags_bad.length > 0 && (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-500">気になった点</h3>
            <div className="flex flex-wrap gap-2">
              {log.tags_bad.map((tag) => (
                <span key={tag} className="rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-sm font-medium text-rose-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Memo */}
        {log.memo && (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-2">
            <h3 className="text-sm font-semibold text-stone-500">一言メモ</h3>
            <p className="text-stone-700 leading-relaxed">{log.memo}</p>
          </div>
        )}

        {/* Partner */}
        <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-500">パートナーの反応</h3>
          <span className={cn('rounded-full px-4 py-1.5 text-sm font-semibold', partner.className)}>
            {partner.label}
          </span>
        </div>
      </main>
    </div>
  )
}

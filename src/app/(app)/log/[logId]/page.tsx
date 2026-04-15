import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ExternalLink, NotebookPen, Pencil } from 'lucide-react'
import type { PropertyLog, PartnerReaction, PropertyType } from '@/types'
import { cn } from '@/lib/utils'
import { DeleteLogButton } from '@/components/property/DeleteLogButton'
import { PartnerReactionForm } from '@/components/property/PartnerReactionForm'
import { Card, CardContent } from '@/components/ui/card'

const PARTNER_LABEL: Record<PartnerReaction, { label: string; className: string }> = {
  best:    { label: '最高',    className: 'bg-amber-100 text-amber-700' },
  good:    { label: 'いいな',  className: 'bg-amber-50 text-amber-600' },
  okay:    { label: 'ありかな', className: 'bg-stone-100 text-stone-500' },
  unknown: { label: '未確認',  className: 'bg-stone-50 text-stone-400' },
}

const SCORE_LABEL: Record<number, { label: string; className: string }> = {
  3: { label: '最高',    className: 'bg-amber-500 text-white' },
  2: { label: 'いいな',  className: 'bg-amber-100 text-amber-700' },
  1: { label: 'ありかな', className: 'bg-stone-100 text-stone-500' },
}

const TYPE_LABEL: Record<PropertyType, { label: string; className: string }> = {
  mansion: { label: 'マンション', className: 'bg-amber-100 text-amber-700' },
  house:   { label: '戸建て',     className: 'bg-emerald-100 text-emerald-700' },
  land:    { label: '土地',       className: 'bg-sky-100 text-sky-700' },
}

interface Props {
  params: { logId: string }
}

export default async function LogDetailPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // プロジェクトメンバーであれば自分以外のログも閲覧可（RLSが担保）
  const { data: logRaw } = await supabase
    .from('property_logs')
    .select('*, users_profile(name)')
    .eq('id', params.logId)
    .single()

  if (!logRaw) notFound()

  const log = logRaw as PropertyLog & { users_profile: { name: string | null } | null }
  const isMyLog = log.user_id === user.id
  const creatorName = log.users_profile?.name ?? 'パートナー'

  const dateStr = new Date(log.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="pb-28">
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Link
                  href="/log"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500"
                >
                  <ArrowLeft className="size-4" strokeWidth={1.5} />
                </Link>
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
                    <NotebookPen className="size-3.5 text-amber-500" />
                    {isMyLog ? 'My log' : `${creatorName}'s log`}
                  </div>
                  <h1
                    className="mt-4 text-[1.75rem] font-bold text-stone-900"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    記録の詳細
                  </h1>
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-stone-500">
                    <CalendarDays className="size-4" />
                    {dateStr}
                  </div>
                </div>
              </div>
              {/* 編集・削除は登録者のみ */}
              {isMyLog && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/log/${log.id}/edit`}
                    className="flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-medium text-stone-500 transition hover:border-amber-300 hover:text-amber-600"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.5} />
                    編集
                  </Link>
                  <DeleteLogButton logId={log.id} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </header>

      <main className="px-5 space-y-4">
        {/* Title card */}
        <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5">
          {log.property_type && (() => {
            const t = TYPE_LABEL[log.property_type]
            return (
              <span className={cn('mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold', t.className)}>
                {t.label}
              </span>
            )
          })()}
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

          {/* 登録者のスコア */}
          <div className="mt-3 flex items-center gap-2">
            {!isMyLog && (
              <span className="text-xs text-stone-400">{creatorName}のスコア</span>
            )}
            {(() => {
              const s = SCORE_LABEL[log.score] ?? SCORE_LABEL[1]
              return (
                <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', s.className)}>
                  {s.label}
                </span>
              )
            })()}
          </div>
        </div>

        {/* Good tags */}
        {log.tags_good.length > 0 && (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stone-500">
              {isMyLog ? '良かった点' : `${creatorName}が良いと思った点`}
            </h3>
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
            <h3 className="text-sm font-semibold text-stone-500">
              {isMyLog ? '気になった点' : `${creatorName}が気になった点`}
            </h3>
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
            <h3 className="text-sm font-semibold text-stone-500">
              {isMyLog ? '一言メモ' : `${creatorName}のメモ`}
            </h3>
            <p className="text-stone-700 leading-relaxed">{log.memo}</p>
          </div>
        )}

        {/* パートナーの反応セクション */}
        <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-stone-500">
            {isMyLog ? 'パートナーの反応' : '自分の反応'}
          </h3>

          {isMyLog ? (
            /* 登録者から見た場合: パートナーの反応を表示（read-only） */
            log.partner_score ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const s = SCORE_LABEL[log.partner_score] ?? SCORE_LABEL[1]
                    return (
                      <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', s.className)}>
                        {s.label}
                      </span>
                    )
                  })()}
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', PARTNER_LABEL[log.partner_reaction].className)}>
                    {PARTNER_LABEL[log.partner_reaction].label}
                  </span>
                </div>
                {log.partner_comment && (
                  <p className="text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                    &ldquo;{log.partner_comment}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">まだ反応がありません</p>
            )
          ) : (
            /* パートナーから見た場合: 反応入力フォーム */
            <PartnerReactionForm
              logId={log.id}
              initialData={log.partner_score ? {
                partner_score: log.partner_score,
                partner_reaction: log.partner_reaction,
                partner_comment: log.partner_comment,
              } : undefined}
            />
          )}
        </div>
      </main>
    </div>
  )
}

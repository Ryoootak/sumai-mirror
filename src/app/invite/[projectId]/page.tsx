import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AcceptInviteButton } from '@/components/pair/AcceptInviteButton'
import { getActiveProjectId, getProjectCounts } from '@/lib/active-project'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRightLeft, Combine, Users } from 'lucide-react'

interface InvitePageProps {
  params: { projectId: string }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${params.projectId}`)
  }

  const activeProjectId = await getActiveProjectId(supabase, user.id)

  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', params.projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  const alreadyJoined = Boolean(membership)
  const needsDecision = Boolean(activeProjectId && activeProjectId !== params.projectId && !alreadyJoined)
  const currentCounts = needsDecision
    ? await getProjectCounts(supabase, activeProjectId!, user.id)
    : null

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#fff8f0_0%,#fafaf8_46%,#f5f5f4_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md items-center">
        <div className="w-full space-y-4">
          <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="p-6 text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
                <Users className="size-7" />
              </div>
              <h1
                className="mt-4 text-2xl font-bold text-stone-800"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                ペア招待が届いています
              </h1>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                同じ物件ログと分析を見ながら、二人で判断材料を共有できます。
              </p>
            </CardContent>
          </Card>

          {alreadyJoined ? (
            <Card>
              <CardContent className="space-y-3 p-6 text-center">
                <p className="text-sm font-medium text-emerald-600">このペアにはすでに参加済みです。</p>
                <Link
                  href="/pair"
                  className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                >
                  ペア画面を開く
                </Link>
              </CardContent>
            </Card>
          ) : needsDecision ? (
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-stone-900">今の環境をどう扱いますか？</h2>
                  <p className="text-sm leading-7 text-stone-500">
                    すでに別の環境を使っています。参加前に、現在の記録をどうするか選んでください。
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-600">
                  現在の環境には、自分のログが <span className="font-semibold text-stone-900">{currentCounts?.logCount ?? 0}</span> 件、
                  分析が <span className="font-semibold text-stone-900">{currentCounts?.analysisCount ?? 0}</span> 件あります。
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                        <ArrowRightLeft className="size-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900">相手の環境を本番にする</h3>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            今の環境は残したまま、見る先だけ相手の環境へ切り替えます。
                          </p>
                        </div>
                        <AcceptInviteButton
                          projectId={params.projectId}
                          mode="switch_active"
                          label="相手の環境を使う"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                        <Combine className="size-4" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="text-sm font-semibold text-stone-900">自分の記録を相手の環境へ移す</h3>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            自分のログを相手の環境へ移し、分析は最新状態で再生成しやすいように消去します。
                          </p>
                        </div>
                        <AcceptInviteButton
                          projectId={params.projectId}
                          mode="merge_logs"
                          label="記録を移して参加する"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-6 text-center">
                <p className="text-sm leading-7 text-stone-500">
                  この招待を受けると、以後は同じ環境で物件ログと分析を共有できます。
                </p>
                <AcceptInviteButton projectId={params.projectId} />
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs leading-relaxed text-stone-400">
            招待参加後も、見る先は常に1つの active project に固定されます。
          </p>
        </div>
      </div>
    </div>
  )
}

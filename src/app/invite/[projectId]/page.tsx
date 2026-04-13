import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AcceptInviteButton } from '@/components/pair/AcceptInviteButton'

interface InvitePageProps {
  params: { projectId: string }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${params.projectId}`)
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', params.projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  const alreadyJoined = Boolean(membership)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
          🏡
        </div>
        <h1
          className="mt-5 text-2xl font-bold text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          ペア招待が届いています
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          SUMAI MIRROR で家探しの記録を共有できます。
          <br />
          参加すると、物件ログと価値観の分析を一緒に見られます。
        </p>

        <div className="mt-8">
          {alreadyJoined ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-emerald-600">このペアにはすでに参加済みです。</p>
              <Link
                href="/pair"
                className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                ペア画面を開く
              </Link>
            </div>
          ) : (
            <AcceptInviteButton projectId={params.projectId} />
          )}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-stone-400">
          参加後は自分の記録も同じペアにまとまります。
        </p>
      </div>
    </div>
  )
}

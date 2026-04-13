import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateProject } from '@/lib/project'
import { Heart, Link2, Users } from 'lucide-react'
import { CopyInviteButton } from '@/components/pair/CopyInviteButton'
import { Card, CardContent } from '@/components/ui/card'

export default async function PairPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getOrCreateProject(supabase, user.id)

  // パートナーを取得
  const { data: members } = await supabase
    .from('project_members')
    .select('user_id, role, users_profile(name)')
    .eq('project_id', projectId)

  const partner = members?.find((m) => m.user_id !== user.id)

  return (
    <div className="pb-28">
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
              <Users className="size-3.5 text-amber-500" />
              Shared view
            </div>
            <h1
              className="mt-4 text-[2rem] font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              ペア
            </h1>
            <p className="mt-2 text-sm leading-7 text-stone-500">パートナーと同じログを見ながら、好みのズレも共有できます。</p>
          </CardContent>
        </Card>
      </header>

      <main className="px-5 space-y-4">
        {partner ? (
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Users className="size-5" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-semibold text-stone-900">
                  {(partner.users_profile as { name?: string } | null)?.name ?? 'パートナー'}
                </p>
                <p className="mt-0.5 text-sm font-medium text-emerald-600">接続済み</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="space-y-5 p-6">
              <div className="inline-flex items-center justify-center rounded-2xl bg-amber-50 p-3 text-amber-600">
                <Link2 className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                  パートナーを招待しよう
                </h3>
                <p className="mt-2 text-sm leading-7 text-stone-500">
                  招待リンクを送ると、相手も同じログと分析を見られるようになります。
                </p>
              </div>
              <CopyInviteButton projectId={projectId} />
            </CardContent>
          </Card>
        )}

        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-amber-600" strokeWidth={1.5} />
              <h3 className="text-sm font-semibold text-amber-900">ペア機能でできること</h3>
            </div>
            <ul className="space-y-2 text-sm leading-7 text-amber-800/90">
              <li>お互いの評価を並べて比較</li>
              <li>二人の優先度のズレを可視化</li>
              <li>パートナーの反応を記録に残す</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

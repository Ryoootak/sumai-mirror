import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreateProject } from '@/lib/project'
import { Heart } from 'lucide-react'
import { CopyInviteButton } from '@/components/pair/CopyInviteButton'

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
      <header className="px-5 pt-12 pb-6">
        <h1
          className="text-2xl font-bold text-stone-800"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          ペア
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">パートナーと家探しを共有</p>
      </header>

      <main className="px-5 space-y-4">
        {/* Partner status */}
        {partner ? (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
              👫
            </div>
            <div>
              <p className="font-semibold text-stone-800">
                {(partner.users_profile as { name?: string } | null)?.name ?? 'パートナー'}
              </p>
              <p className="text-sm text-emerald-600 font-medium mt-0.5">✓ ペア設定済み</p>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white border border-stone-100 shadow-sm p-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-2xl">
              💌
            </div>
            <div>
              <h3
                className="font-bold text-stone-800"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                パートナーを招待しよう
              </h3>
              <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">
                招待リンクを送って、<br />一緒に家探しを進めよう。
              </p>
            </div>

            <CopyInviteButton projectId={projectId} />
          </div>
        )}

        {/* Info cards */}
        <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-amber-600" strokeWidth={1.5} />
            <h3 className="font-semibold text-amber-800 text-sm">ペア機能でできること</h3>
          </div>
          <ul className="space-y-1.5 text-sm text-amber-700 leading-relaxed pl-6">
            <li>お互いの評価を並べて比較</li>
            <li>二人の優先度のズレを可視化</li>
            <li>パートナーの反応を記録に残す</li>
          </ul>
        </div>

        <p className="text-center text-xs text-stone-400 leading-relaxed px-4">
          招待リンクを相手に送ると、このペアに参加できます。<br />
          参加後は物件ログと価値観の分析を一緒に見られます。
        </p>
      </main>
    </div>
  )
}

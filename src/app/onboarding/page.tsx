import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Compass, Link2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StartProjectActions } from '@/components/onboarding/StartProjectActions'
import { getActiveProjectId } from '@/lib/active-project'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeProjectId = await getActiveProjectId(supabase, user.id)
  if (activeProjectId) redirect('/log')

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#fff8f0_0%,#fafaf8_46%,#f5f5f4_100%)] px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-md items-center">
        <div className="w-full space-y-5 rounded-[2rem] border border-stone-200/80 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-7">
          <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
            <CardContent className="relative p-5 sm:p-6">
              <Image
                src="/images/home_mirror.png"
                alt="SUMAI MIRROR"
                width={190}
                height={128}
                priority
                className="mx-auto h-auto w-full max-w-[190px] object-contain"
              />
              <div className="mt-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700/80">
                  First step
                </p>
                <h1
                  className="mt-2 text-[1.9rem] font-bold tracking-tight text-stone-800"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  まずは物件候補を1件追加しましょう
                </h1>
                <p className="mt-2 text-sm leading-7 text-stone-500">
                  候補を入れ始めると、あとから比較しやすくなります。共有はあとからでも始められます。
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3 rounded-[1.75rem] border border-stone-200/80 bg-stone-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
                <Users className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-800">パートナーと共有して始める</h2>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  招待リンクを作って、同じ物件候補を一緒に見られる環境を作ります。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
                <Compass className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-800">ひとりで始める</h2>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  自分のペースで候補を整理できます。必要になったらあとから共有できます。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl bg-white p-2 text-amber-600 shadow-sm">
                <Link2 className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-stone-800">招待リンクで参加する</h2>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  相手から届いたリンクを開くと、同じ候補一覧に参加できます。
                </p>
              </div>
            </div>
          </div>

          <StartProjectActions />

          <p className="text-center text-sm text-stone-500">
            招待リンクを受け取っている場合は、そのリンクを開くと参加後に物件候補から始まります。
          </p>
        </div>
      </div>
    </div>
  )
}

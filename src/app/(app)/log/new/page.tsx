import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, SquarePen } from 'lucide-react'
import { PropertyLogForm } from '@/components/property/PropertyLogForm'
import { getActiveProjectId } from '@/lib/active-project'
import { Card, CardContent } from '@/components/ui/card'

export default async function NewLogPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getActiveProjectId(supabase, user.id)
  if (!projectId) redirect('/onboarding')

  return (
    <div className="pb-28">
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Link
                href="/log"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} />
              </Link>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
                  <SquarePen className="size-3.5 text-amber-500" />
                  New candidate
                </div>
                <h1
                  className="mt-4 text-[1.75rem] font-bold text-stone-800"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  物件候補を追加する
                </h1>
                <p className="mt-2 text-sm leading-7 text-stone-500">URLを貼ると物件名などを自動入力できます。足りない項目だけ手で補ってください。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <main className="px-5">
        <PropertyLogForm projectId={projectId} />
      </main>
    </div>
  )
}

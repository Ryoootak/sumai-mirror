import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { PropertyLogForm } from '@/components/property/PropertyLogForm'
import { getOrCreateProject } from '@/lib/project'
import { Card, CardContent } from '@/components/ui/card'
import type { PropertyLog } from '@/types'

interface Props {
  params: { logId: string }
}

export default async function EditLogPage({ params }: Props) {
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

  const projectId = await getOrCreateProject(supabase, user.id)

  return (
    <div className="pb-28">
      <header className="px-5 pb-6 pt-10">
        <Card className="overflow-hidden border-stone-200/80 bg-[linear-gradient(180deg,#fffdfb_0%,#fff7ef_100%)]">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Link
                href={`/log/${log.id}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:bg-stone-50"
              >
                <ArrowLeft className="size-4" strokeWidth={1.5} />
              </Link>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 shadow-sm">
                  <Pencil className="size-3.5 text-amber-500" />
                  Edit entry
                </div>
                <h1
                  className="mt-4 text-[1.75rem] font-bold text-stone-900"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  記録を編集する
                </h1>
                <p className="mt-2 text-sm leading-7 text-stone-500">
                  {log.title ?? '名称未設定の物件'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </header>

      <main className="px-5">
        <PropertyLogForm projectId={projectId} initialData={log} mode="edit" />
      </main>
    </div>
  )
}

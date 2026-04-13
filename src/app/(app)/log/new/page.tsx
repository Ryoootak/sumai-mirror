import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PropertyLogForm } from '@/components/property/PropertyLogForm'
import { getOrCreateProject } from '@/lib/project'

export default async function NewLogPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectId = await getOrCreateProject(supabase, user.id)

  return (
    <div className="pb-28">
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/log"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 transition"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </Link>
          <div>
            <h1
              className="text-xl font-bold text-stone-800"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              物件を記録する
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">30秒で記録できます</p>
          </div>
        </div>
      </header>

      <main className="px-5">
        <PropertyLogForm projectId={projectId} />
      </main>
    </div>
  )
}

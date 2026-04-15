import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId, getProjectMode } from '@/lib/active-project'
import { TabBar } from '@/components/layout/TabBar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const projectId = user ? await getActiveProjectId(supabase, user.id) : null
  const mode = projectId ? await getProjectMode(supabase, projectId) : 'pair'

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="mx-auto max-w-md min-h-screen">
        {children}
      </div>
      <TabBar isSolo={mode === 'solo'} />
    </div>
  )
}

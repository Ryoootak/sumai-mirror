import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveProjectId } from '@/lib/active-project'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeProjectId = await getActiveProjectId(supabase, user.id)
  redirect(activeProjectId ? '/log' : '/onboarding')
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProjectForUser, getActiveProjectId } from '@/lib/active-project'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { mode } = await request.json().catch(() => ({})) as { mode?: 'solo' | 'pair' }

  if (mode !== 'solo' && mode !== 'pair') {
    return NextResponse.json({ error: '開始方法が不正です' }, { status: 400 })
  }

  const currentActiveProjectId = await getActiveProjectId(supabase, user.id)
  if (currentActiveProjectId) {
    return NextResponse.json({ ok: true, projectId: currentActiveProjectId, mode })
  }

  const projectId = await createProjectForUser(supabase, user.id, 'owner')
  return NextResponse.json({ ok: true, projectId, mode })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  ensureProjectMembership,
  getActiveProjectId,
  getProjectCounts,
  setActiveProjectId,
} from '@/lib/active-project'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId, mode } = await request.json().catch(() => ({})) as {
    projectId?: string
    mode?: 'direct' | 'switch_active' | 'merge_logs'
  }
  if (typeof projectId !== 'string' || !projectId) {
    return NextResponse.json({ error: '招待リンクが不正です' }, { status: 400 })
  }

  const currentActiveProjectId = await getActiveProjectId(supabase, user.id)

  const { data: memberships, error: membershipError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 })
  }

  if (memberships?.some((membership) => membership.project_id === projectId)) {
    await setActiveProjectId(supabase, user.id, projectId)
    return NextResponse.json({ ok: true, alreadyJoined: true })
  }

  if (!currentActiveProjectId || currentActiveProjectId === projectId) {
    await ensureProjectMembership(supabase, user.id, projectId, 'partner')
    await setActiveProjectId(supabase, user.id, projectId)
    return NextResponse.json({ ok: true })
  }

  if (mode !== 'switch_active' && mode !== 'merge_logs') {
    return NextResponse.json({ error: '現在の記録をどう扱うか選択してください' }, { status: 409 })
  }

  if (mode === 'merge_logs') {
    const currentCounts = await getProjectCounts(supabase, currentActiveProjectId, user.id)

    if (currentCounts.logCount > 0) {
      const { error: moveLogsError } = await supabase
        .from('property_logs')
        .update({ project_id: projectId })
        .eq('project_id', currentActiveProjectId)
        .eq('user_id', user.id)

      if (moveLogsError) {
        return NextResponse.json({ error: moveLogsError.message }, { status: 400 })
      }
    }

    const { error: deleteAnalysesError } = await supabase
      .from('analyses')
      .delete()
      .eq('project_id', currentActiveProjectId)
      .eq('user_id', user.id)

    if (deleteAnalysesError) {
      return NextResponse.json({ error: deleteAnalysesError.message }, { status: 400 })
    }

    const { error: invalidateTargetAnalysesError } = await supabase
      .from('analyses')
      .delete()
      .eq('project_id', projectId)

    if (invalidateTargetAnalysesError) {
      return NextResponse.json({ error: invalidateTargetAnalysesError.message }, { status: 400 })
    }
  }

  await ensureProjectMembership(supabase, user.id, projectId, 'partner')
  await setActiveProjectId(supabase, user.id, projectId)

  return NextResponse.json({ ok: true })
}

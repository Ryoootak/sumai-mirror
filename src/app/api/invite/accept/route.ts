import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await request.json()
  if (typeof projectId !== 'string' || !projectId) {
    return NextResponse.json({ error: '招待リンクが不正です' }, { status: 400 })
  }

  const { data: memberships, error: membershipError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 })
  }

  if (memberships?.some((membership) => membership.project_id === projectId)) {
    return NextResponse.json({ ok: true, alreadyJoined: true })
  }

  for (const membership of memberships ?? []) {
    const currentProjectId = membership.project_id

    const [{ count: memberCount }, { count: logCount }, { count: analysisCount }] = await Promise.all([
      supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', currentProjectId),
      supabase
        .from('property_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', currentProjectId),
      supabase
        .from('analyses')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', currentProjectId),
    ])

    const canLeaveSoloProject =
      (memberCount ?? 0) <= 1 &&
      (logCount ?? 0) === 0 &&
      (analysisCount ?? 0) === 0

    if (canLeaveSoloProject) {
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', currentProjectId)
        .eq('user_id', user.id)
    }
  }

  const { error: joinError } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: projectId,
        user_id: user.id,
        role: 'partner',
      },
      { onConflict: 'project_id,user_id' }
    )

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

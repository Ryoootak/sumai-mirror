import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  getActiveProjectId,
  getProjectCounts,
  setActiveProjectId,
} from '@/lib/active-project'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
    }

    const { projectId, mode } = await request.json().catch(() => ({})) as {
      projectId?: string
      mode?: 'direct' | 'switch_active' | 'merge_logs'
    }
    if (typeof projectId !== 'string' || !projectId) {
      return NextResponse.json({ error: '招待リンクが不正です' }, { status: 400 })
    }

    // メンバーシップ挿入はRLSをバイパスするためadminクライアントを使用
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const currentActiveProjectId = await getActiveProjectId(supabase, user.id)

    const { data: memberships, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 400 })
    }

    if (memberships?.some((m) => m.project_id === projectId)) {
      await setActiveProjectId(supabase, user.id, projectId)
      return NextResponse.json({ ok: true, alreadyJoined: true })
    }

    if (!currentActiveProjectId || currentActiveProjectId === projectId) {
      const { error } = await admin
        .from('project_members')
        .insert({ project_id: projectId, user_id: user.id, role: 'partner' })
      if (error && error.code !== '23505') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
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

    const { error: insertError } = await admin
      .from('project_members')
      .insert({ project_id: projectId, user_id: user.id, role: 'partner' })
    if (insertError && insertError.code !== '23505') {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    await setActiveProjectId(supabase, user.id, projectId)
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[invite/accept] unexpected error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '招待の参加に失敗しました' },
      { status: 500 }
    )
  }
}

import type { SupabaseClient } from '@supabase/supabase-js'

function isMissingActiveProjectColumnError(message: string) {
  return message.includes('active_project_id')
    && (message.includes('column') || message.includes('schema cache'))
}

async function getFallbackProjectId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: memberships, error } = await supabase
    .from('project_members')
    .select('project_id, role')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`fallback projectの取得に失敗しました: ${error.message}`)
  }

  const ownerProject = memberships?.find((membership) => membership.role === 'owner')?.project_id
  return ownerProject ?? memberships?.[0]?.project_id ?? null
}

export async function getActiveProjectId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('users_profile')
    .select('active_project_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingActiveProjectColumnError(error.message)) {
      return getFallbackProjectId(supabase, userId)
    }
    throw new Error(`active projectの取得に失敗しました: ${error.message}`)
  }

  return data?.active_project_id ?? null
}

export async function setActiveProjectId(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | null
) {
  const { error } = await supabase
    .from('users_profile')
    .update({ active_project_id: projectId })
    .eq('id', userId)

  if (error) {
    if (isMissingActiveProjectColumnError(error.message)) {
      return
    }
    throw new Error(`active projectの更新に失敗しました: ${error.message}`)
  }
}

export async function getProjectMode(
  supabase: SupabaseClient,
  projectId: string
): Promise<'solo' | 'pair'> {
  const { data } = await supabase
    .from('projects')
    .select('mode')
    .eq('id', projectId)
    .single()
  return ((data as { mode?: string } | null)?.mode ?? 'pair') as 'solo' | 'pair'
}

export async function createProjectForUser(
  supabase: SupabaseClient,
  userId: string,
  role: 'owner' | 'partner' = 'owner',
  mode: 'solo' | 'pair' = 'pair'
) {
  const projectId = crypto.randomUUID()

  const { error: projectError } = await supabase
    .from('projects')
    .insert({ id: projectId, name: '家探し', status: 'active', mode })

  if (projectError) {
    throw new Error(`プロジェクトの作成に失敗しました: ${projectError.message}`)
  }

  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
    })

  if (memberError) {
    throw new Error(`プロジェクト参加に失敗しました: ${memberError.message}`)
  }

  await setActiveProjectId(supabase, userId, projectId)
  return projectId
}

export async function ensureProjectMembership(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  role: 'owner' | 'partner' = 'partner'
) {
  const { error } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: projectId,
        user_id: userId,
        role,
      },
      { onConflict: 'project_id,user_id' }
    )

  if (error) {
    throw new Error(`プロジェクト参加に失敗しました: ${error.message}`)
  }
}

export async function getProjectCounts(
  supabase: SupabaseClient,
  projectId: string,
  userId?: string
) {
  const logsQuery = supabase
    .from('property_logs')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const analysesQuery = supabase
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const memberQuery = supabase
    .from('project_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (userId) {
    logsQuery.eq('user_id', userId)
    analysesQuery.eq('user_id', userId)
  }

  const [{ count: memberCount }, { count: logCount }, { count: analysisCount }] =
    await Promise.all([memberQuery, logsQuery, analysesQuery])

  return {
    memberCount: memberCount ?? 0,
    logCount: logCount ?? 0,
    analysisCount: analysisCount ?? 0,
  }
}

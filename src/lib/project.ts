import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * ユーザーのプロジェクトIDを取得、なければ自動作成する。
 * プロジェクト概念はUI上に露出しない。
 */
export async function getOrCreateProject(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // 既存のプロジェクトを探す
  const { data: membership } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (membership?.project_id) return membership.project_id

  // なければ作成
  const { data: project, error } = await supabase
    .from('projects')
    .insert({ name: '家探し', status: 'active' })
    .select('id')
    .single()

  if (error || !project) {
    throw new Error('プロジェクトの作成に失敗しました: ' + (error?.message ?? 'unknown'))
  }

  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: userId,
    role: 'owner',
  })

  return project.id
}

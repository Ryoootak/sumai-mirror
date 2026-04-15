// ============================================================
// SUMAI MIRROR — Shared TypeScript types
// ============================================================

export type ProjectStatus = 'active' | 'completed' | 'paused'
export type PropertyType = 'mansion' | 'house' | 'land'
export type ProjectRole = 'owner' | 'partner'
export type PartnerReaction = 'best' | 'good' | 'okay' | 'unknown'
export type AnalysisType = 'priority' | 'alignment' | 'timeline'
export type AnalysisFeedback = 'up' | 'down'

export interface UserProfile {
  id: string
  name: string | null
  preferences: Record<string, unknown>
  created_at: string
}

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  created_at: string
}

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectRole
}

export interface PropertyLog {
  id: string
  project_id: string
  user_id: string
  url: string | null
  title: string | null
  price: string | null
  property_type: PropertyType | null
  score: number
  tags_good: string[]
  tags_bad: string[]
  memo: string | null
  // パートナーが自分で入力するフィールド（非登録者のみ更新可）
  partner_score: number | null
  partner_reaction: PartnerReaction
  partner_comment: string | null
  created_at: string
}

export interface Analysis {
  id: string
  project_id: string
  user_id: string
  type: AnalysisType
  result: Record<string, unknown>
  feedback: AnalysisFeedback | null
  created_at: string
}

// OGP fetch response
export interface OgpData {
  title: string | null
  description: string | null
  image: string | null
  price: string | null
}

// Form state for PropertyLogForm（登録者自身の評価のみ）
export interface PropertyLogFormData {
  url: string
  title: string
  price: string
  property_type: PropertyType | null
  score: number
  tags_good: string[]
  tags_bad: string[]
  memo: string
}

// Form state for PartnerReactionForm（パートナーが入力）
export interface PartnerReactionFormData {
  partner_score: number
  partner_reaction: PartnerReaction
  partner_comment: string
}

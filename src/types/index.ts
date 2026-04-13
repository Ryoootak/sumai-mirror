// ============================================================
// SUMAI MIRROR — Shared TypeScript types
// ============================================================

export type ProjectStatus = 'active' | 'completed' | 'paused'
export type ProjectRole = 'owner' | 'partner'
export type PartnerReaction = 'great' | 'good' | 'neutral' | 'bad' | 'unknown'
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
  score: number
  tags_good: string[]
  tags_bad: string[]
  memo: string | null
  partner_reaction: PartnerReaction
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

// Form state for PropertyLogForm
export interface PropertyLogFormData {
  url: string
  title: string
  price: string
  score: number
  tags_good: string[]
  tags_bad: string[]
  memo: string
  partner_reaction: PartnerReaction
}

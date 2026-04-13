import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, feedback } = await req.json()

  // Update the latest analysis feedback
  const { data: analysis } = await supabase
    .from('analyses')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .eq('type', 'priority')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (analysis) {
    await supabase
      .from('analyses')
      .update({ feedback })
      .eq('id', analysis.id)
  }

  return NextResponse.json({ ok: true })
}

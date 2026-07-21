'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type ExtractedRequirement = {
  category: string | null
  description: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  is_urgent: boolean
}

export async function saveExtractedRequirement(extracted: ExtractedRequirement) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sessionId = crypto.randomUUID()

  const { data, error } = await supabase
    .from('ai_recommendations')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      extracted_requirement: extracted,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/ai-chat/recommendations/${data.id}`)
}
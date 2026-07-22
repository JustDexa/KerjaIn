import { SupabaseClient } from '@supabase/supabase-js'

type NotificationType = 'job_application' | 'application_accepted' | 'application_rejected' | 'new_message' | 'new_review'

export async function createNotification(
  supabase: SupabaseClient,
  params: { userId: string; type: NotificationType; title: string; body: string; link: string }
) {
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
  })
}
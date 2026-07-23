import { SupabaseClient } from '@supabase/supabase-js'

type ActionType =
  | 'login'
  | 'job_posted'
  | 'job_applied'
  | 'application_accepted'
  | 'review_submitted'
  | 'transaction_completed'
  | 'listing_created'

export async function logActivity(
  supabase: SupabaseClient,
  params: { userId: string; role: 'user' | 'umkm' | 'admin'; actionType: ActionType; description: string }
) {
  // sengaja gak di-await sampai selesai / gak dilempar errornya ke pemanggil —
  // logging gak boleh sampai gagalin aksi utama kalau ada masalah kecil
  await supabase.from('activity_logs').insert({
    user_id: params.userId,
    role: params.role,
    action_type: params.actionType,
    description: params.description,
  }).then(({ error }) => {
    if (error) console.error('[activity_log] gagal mencatat:', error.message)
  })
}
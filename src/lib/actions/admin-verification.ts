'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null

  return { supabase, adminId: user.id }
}

export async function approveVerification(formData: FormData) {
  const ctx = await assertAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { supabase, adminId } = ctx

  const id = formData.get('id') as string
  const userId = formData.get('userId') as string

  await supabase
    .from('verification_documents')
    .update({ status: 'verified', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  await supabase.from('users').update({ is_verified: true }).eq('id', userId)

  revalidatePath('/admin/monitoring')
  return { success: true }
}

export async function rejectVerification(formData: FormData) {
  const ctx = await assertAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }
  const { supabase, adminId } = ctx

  const id = formData.get('id') as string
  const note = formData.get('note') as string

  await supabase
    .from('verification_documents')
    .update({ status: 'rejected', rejection_note: note, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/monitoring')
  return { success: true }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') throw new Error('Forbidden')
  
  return user
}

export async function submitVerificationDocs(ktpUrl: string, selfieUrl: string) {
  const supabase = await createClient() // <-- Tambah await di sini
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('verification_documents').insert({
    user_id: user.id,
    ktp_photo_url: ktpUrl,
    selfie_photo_url: selfieUrl,
    status: 'pending'
  })

  if (error) throw error

  await supabase.from('users').update({ verification_status: 'pending' }).eq('id', user.id)

  revalidatePath('/profile')
  revalidatePath('/verification')
  
  return { success: true }
}

export async function reviewVerification(docId: string, userId: string, isApproved: boolean, note?: string) {
  const supabase = await createClient() // <-- Tambah await di sini
  const admin = await assertAdmin(supabase)

  const status = isApproved ? 'verified' : 'rejected'

  const { error: docError } = await supabase.from('verification_documents').update({
    status: status,
    rejection_note: note || null,
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString()
  }).eq('id', docId)

  if (docError) throw docError

  const { error: userError } = await supabase.from('users').update({
    is_verified: isApproved,
    verification_status: status
  }).eq('id', userId)

  if (userError) throw userError

  revalidatePath('/admin/verifications')
  return { success: true }
}
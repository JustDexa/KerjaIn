'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login' }

  const ktpUrl = formData.get('ktpUrl') as string
  const selfieUrl = formData.get('selfieUrl') as string

  if (!ktpUrl || !selfieUrl) return { error: 'Foto KTP dan selfie wajib diisi' }

  const { error } = await supabase.from('verification_documents').insert({
    user_id: user.id,
    ktp_photo_url: ktpUrl,
    selfie_photo_url: selfieUrl,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath('/verification')
  revalidatePath('/profile')
  return { success: true }
}
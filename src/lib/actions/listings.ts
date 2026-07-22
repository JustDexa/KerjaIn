'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const photoUrl = formData.get('photoUrl') as string

  const { error } = await supabase.from('listings').insert({
    umkm_id: user.id,
    type: formData.get('type') as string,
    transaction_type: formData.get('transactionType') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: Math.max(0, Number(formData.get('price')) || 0) || null,
    price_unit: formData.get('priceUnit') as string,
    estimated_duration: formData.get('estimatedDuration') as string,
    photos: photoUrl ? [photoUrl] : null,
  })

  if (error) return { error: error.message }
  redirect('/umkm/catalog')
}

export async function updateListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const photoUrl = formData.get('photoUrl') as string

  const updateData: Record<string, unknown> = {
    type: formData.get('type') as string,
    transaction_type: formData.get('transactionType') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: Math.max(0, Number(formData.get('price')) || 0) || null,
    price_unit: formData.get('priceUnit') as string,
    estimated_duration: formData.get('estimatedDuration') as string,
  }
  if (photoUrl) updateData.photos = [photoUrl]

  const { error } = await supabase.from('listings').update(updateData).eq('id', id).eq('umkm_id', user.id)

  if (error) return { error: error.message }
  redirect('/umkm/catalog')
}

export async function deleteListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  await supabase.from('listings').delete().eq('id', id).eq('umkm_id', user.id)
  revalidatePath('/umkm/catalog')
}
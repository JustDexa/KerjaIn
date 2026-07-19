'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('listings').insert({
    umkm_id: user.id,
    type: formData.get('type') as string,
    transaction_type: formData.get('transactionType') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: Number(formData.get('price')) || null,
    price_unit: formData.get('priceUnit') as string,
    estimated_duration: formData.get('estimatedDuration') as string,
  })

  if (error) return { error: error.message }

  redirect('/umkm/catalog')
}

export async function updateListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('listings')
    .update({
      type: formData.get('type') as string,
      transaction_type: formData.get('transactionType') as string,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')) || null,
      price_unit: formData.get('priceUnit') as string,
      estimated_duration: formData.get('estimatedDuration') as string,
    })
    .eq('id', id)
    .eq('umkm_id', user.id)

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
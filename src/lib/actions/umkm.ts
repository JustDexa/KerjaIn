'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createUmkmProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const businessName = formData.get('businessName') as string
  const description = formData.get('description') as string
  const offeringType = formData.get('offeringType') as string
  const serviceArea = formData.get('serviceArea') as string
  const categoryIds = formData.getAll('categories') as string[]

  const { error } = await supabase.from('umkm_profiles').insert({
    user_id: user.id,
    business_name: businessName,
    description,
    offering_type: offeringType,
    service_area: serviceArea,
  })

  if (error) {
    return { error: error.message }
  }

  if (categoryIds.length > 0) {
    const rows = categoryIds.map((categoryId) => ({ umkm_id: user.id, category_id: categoryId }))
    await supabase.from('umkm_categories').insert(rows)
  }

  redirect('/umkm/dashboard')
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login' }

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('users')
    .update({ full_name: fullName, phone })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateUmkmProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login' }

  const businessName = formData.get('businessName') as string
  const description = formData.get('description') as string
  const serviceArea = formData.get('serviceArea') as string
  const offeringType = formData.get('offeringType') as string
  const basePriceRange = formData.get('basePriceRange') as string
  const operationalHours = formData.get('operationalHours') as string

  const { error } = await supabase
    .from('umkm_profiles')
    .update({
      business_name: businessName,
      description,
      service_area: serviceArea,
      offering_type: offeringType,
      base_price_range: basePriceRange,
      operational_hours: operationalHours,
    })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
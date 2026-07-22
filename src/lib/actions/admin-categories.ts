'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') return null

  return supabase
}

export async function createCategory(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Tidak diizinkan' }

  const name = formData.get('name') as string
  const type = formData.get('type') as string

  const { error } = await supabase.from('categories').insert({ name, type })
  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}

export async function toggleCategoryStatus(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Tidak diizinkan' }

  const id = formData.get('id') as string
  const isActive = formData.get('isActive') === 'true'

  await supabase.from('categories').update({ is_active: !isActive }).eq('id', id)
  revalidatePath('/admin/categories')
}

export async function updateCategory(formData: FormData) {
  const supabase = await assertAdmin()
  if (!supabase) return { error: 'Tidak diizinkan' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string

  const { error } = await supabase.from('categories').update({ name, type }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/categories')
  return { success: true }
}
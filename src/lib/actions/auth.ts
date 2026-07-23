'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logActivity } from '../activity-log'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (role === 'umkm') {
    redirect('/onboarding/umkm')
  }

  redirect('/home')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const { data: userData } = await supabase.from('users').select('role, full_name').eq('id', data.user.id).single()
    if (userData) {
      await logActivity(supabase, {
        userId: data.user.id,
        role: userData.role as 'user' | 'umkm' | 'admin',
        actionType: 'login',
        description: `${userData.full_name ?? 'Pengguna'} login ke platform`,
      })
    }
  }

  redirect('/home')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
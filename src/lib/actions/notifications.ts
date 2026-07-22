'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const link = formData.get('link') as string

  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)

  redirect(link || '/notifications')
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function sendMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login' }

  const conversationId = formData.get('conversationId') as string
  const content = formData.get('content') as string

  if (!content?.trim()) return { error: 'Pesan kosong' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath(`/chat/${conversationId}`)
  return { success: true }
}

export async function startDirectConversation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const umkmId = formData.get('umkmId') as string

  const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('umkm_id', umkmId)
      .maybeSingle()

  if (existing) redirect(`/chat/${existing.id}`)

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, umkm_id: umkmId })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/chat/${data.id}`)
}
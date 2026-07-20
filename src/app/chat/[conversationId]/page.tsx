import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChatRoom } from '@/components/shared/chat-room'

export default async function ChatRoomPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, users(full_name), umkm_profiles(business_name)')
    .eq('id', conversationId)
    .single()

  if (!conversation) notFound()

  // pastiin cuma partisipan yang boleh liat
  if (conversation.user_id !== user.id && conversation.umkm_id !== user.id) {
    notFound()
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const otherPartyName =
    conversation.user_id === user.id
      ? conversation.umkm_profiles?.business_name
      : conversation.users?.full_name

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-bold">Chat dengan {otherPartyName}</h1>
      <ChatRoom
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
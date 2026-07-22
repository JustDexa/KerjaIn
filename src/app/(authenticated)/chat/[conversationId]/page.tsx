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
  if (conversation.user_id !== user.id && conversation.umkm_id !== user.id) notFound()

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  const currentUserRole = (profile?.role as 'user' | 'umkm' | 'admin') ?? 'user'

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const otherPartyName =
    conversation.user_id === user.id
      ? conversation.umkm_profiles?.business_name
      : conversation.users?.full_name

  let existingTransactionId: string | null = null
  if (conversation.job_posting_id) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('id')
      .eq('job_posting_id', conversation.job_posting_id)
      .eq('payment_status', 'pending')
      .maybeSingle()
    existingTransactionId = tx?.id ?? null
  } else {
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      existingTransactionId = tx?.id ?? null
    }

  let jobStatus: string | null = null
  if (conversation.job_posting_id) {
    const { data: job } = await supabase
      .from('job_postings')
      .select('status')
      .eq('id', conversation.job_posting_id)
      .single()
    jobStatus = job?.status ?? null
  }

  let listings: { id: string; title: string; price: number | null; price_unit: string | null }[] = []
    if (currentUserRole === 'user') {
      const { data: listingData } = await supabase
        .from('listings')
        .select('id, title, price, price_unit')
        .eq('umkm_id', conversation.umkm_id)
        .eq('status', 'active')
      listings = listingData ?? []
    }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-bold">Chat dengan {otherPartyName}</h1>
      <ChatRoom
        conversationId={conversationId}
        currentUserId={user.id}
        currentUserRole={currentUserRole}
        initialMessages={messages ?? []}
        jobPostingId={conversation.job_posting_id}
        jobStatus={jobStatus}
        existingTransactionId={existingTransactionId}
        listings={listings}
      />
    </div>
  )
}
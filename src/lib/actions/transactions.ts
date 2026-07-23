'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-log'

export async function createOrGetTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jobPostingId = formData.get('jobPostingId') as string

  // kalau transaksi buat job ini udah ada, langsung ke situ aja (gak bikin dobel)
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('job_posting_id', jobPostingId)
    .maybeSingle()

  if (existing) {
    redirect(`/checkout/${existing.id}`)
  }

  const { data: job } = await supabase
    .from('job_postings')
    .select('user_id, budget_min, budget_max')
    .eq('id', jobPostingId)
    .single()

  if (!job || job.user_id !== user.id) {
    return { error: 'Tidak diizinkan' }
  }

  const { data: acceptedApp } = await supabase
    .from('job_applications')
    .select('umkm_id')
    .eq('job_posting_id', jobPostingId)
    .eq('status', 'accepted')
    .single()

  if (!acceptedApp) {
    return { error: 'Belum ada UMKM yang diterima buat job ini' }
  }

  const totalAmount = job.budget_max ?? job.budget_min ?? 0

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_posting_id: jobPostingId,
      user_id: user.id,
      umkm_id: acceptedApp.umkm_id,
      transaction_type: 'one_time',
      total_amount: totalAmount,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/checkout/${transaction.id}`)
}

export async function markTransactionComplete(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactionId = formData.get('transactionId') as string

  const { data: transaction } = await supabase
    .from('transactions')
    .select('user_id, umkm_id, job_posting_id, payment_status')
    .eq('id', transactionId)
    .single()

  if (!transaction) return { error: 'Transaksi tidak ditemukan' }

  // sekarang cuma UMKM yang boleh tandain selesai (bukan User)
  if (transaction.umkm_id !== user.id) {
    return { error: 'Cuma UMKM yang bisa menandai pekerjaan selesai' }
  }

  if (transaction.payment_status !== 'paid') {
    return { error: 'Belum bisa ditandai selesai — pembayaran belum lunas' }
  }

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', transactionId)

  if (error) return { error: error.message }

  if (transaction.job_posting_id) {
    await supabase
      .from('job_postings')
      .update({ status: 'completed' })
      .eq('id', transaction.job_posting_id)
  }

  const { data: userData } = await supabase.from('users').select('role, full_name').eq('id', user.id).single()
  await logActivity(supabase, {
    userId: user.id,
    role: (userData?.role as 'user' | 'umkm') ?? 'user',
    actionType: 'transaction_completed',
    description: `${userData?.full_name ?? 'Pengguna'} menandai transaksi selesai`,
  })

  revalidatePath(`/transactions/${transactionId}`)
  return { success: true }
}

export async function createTransactionFromListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const conversationId = formData.get('conversationId') as string
  const listingId = formData.get('listingId') as string

  const { data: conversation } = await supabase
    .from('conversations')
    .select('user_id, umkm_id')
    .eq('id', conversationId)
    .single()

  if (!conversation || conversation.user_id !== user.id) {
    return { error: 'Tidak diizinkan' }
  }

  const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('payment_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) redirect(`/checkout/${existing.id}`)

  const { data: listing } = await supabase
    .from('listings')
    .select('id, umkm_id, price, transaction_type')
    .eq('id', listingId)
    .single()

  if (!listing || listing.umkm_id !== conversation.umkm_id) {
    return { error: 'Layanan tidak valid' }
  }

  const { data: listingDetail } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId)
    .single()

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      conversation_id: conversationId,
      listing_id: listingId,
      user_id: user.id,
      umkm_id: conversation.umkm_id,
      transaction_type: listing.transaction_type,
      total_amount: listing.price,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Memesan: "${listingDetail?.title ?? 'layanan ini'}"${listing.price ? ` — Rp${Number(listing.price).toLocaleString('id-ID')}` : ''}`,
  })

  
  redirect(`/checkout/${transaction.id}`)
}

export async function createMultiItemTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const conversationId = formData.get('conversationId') as string
  const itemsRaw = formData.get('items') as string // JSON string: [{listingId, title, price, quantity}]
  const items = JSON.parse(itemsRaw) as { listingId: string; title: string; price: number; quantity: number }[]

  if (!items || items.length === 0) {
    return { error: 'Pilih minimal 1 item' }
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('umkm_id')
    .eq('id', conversationId)
    .single()

  if (!conversation) return { error: 'Percakapan tidak ditemukan' }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      conversation_id: conversationId,
      user_id: user.id,
      umkm_id: conversation.umkm_id,
      transaction_type: items.length > 1 ? 'project' : 'one_time',
      total_amount: totalAmount,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const itemRows = items.map((item) => ({
    transaction_id: transaction.id,
    listing_id: item.listingId,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }))

  await supabase.from('transaction_items').insert(itemRows)

  const summary = items.map((i) => `${i.title}${i.quantity > 1 ? ` (x${i.quantity})` : ''}`).join(', ')
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Memesan: ${summary} — Rp${totalAmount.toLocaleString('id-ID')}`,
  })

  redirect(`/checkout/${transaction.id}`)
}
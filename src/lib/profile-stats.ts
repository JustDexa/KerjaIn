import { createClient } from '@/lib/supabase/server'

export type ProfileStats = {
  primaryCount: number
  completedCount: number
  reviewCount: number
  totalAmount: number
}

export type ActivityItem = {
  type: 'job_posted' | 'review_given' | 'transaction_completed' | 'listing_created' | 'review_received'
  label: string
  date: string
}

export async function getUserStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient()

  const [{ count: jobsPosted }, { count: completed }, { count: reviewsGiven }, { data: paidTx }] = await Promise.all([
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('transactions').select('total_amount').eq('user_id', userId).neq('payment_status', 'pending'),
  ])

  const totalAmount = (paidTx ?? []).reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0)

  return { primaryCount: jobsPosted ?? 0, completedCount: completed ?? 0, reviewCount: reviewsGiven ?? 0, totalAmount }
}

export async function getUmkmStats(umkmId: string): Promise<ProfileStats> {
  const supabase = await createClient()

  const [{ count: jobsReceived }, { count: completed }, { count: reviewsReceived }, { data: paidTx }] = await Promise.all([
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('umkm_id', umkmId),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('umkm_id', umkmId).eq('status', 'completed'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('umkm_id', umkmId),
    supabase.from('transactions').select('total_amount').eq('umkm_id', umkmId).neq('payment_status', 'pending'),
  ])

  const totalAmount = (paidTx ?? []).reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0)

  return { primaryCount: jobsReceived ?? 0, completedCount: completed ?? 0, reviewCount: reviewsReceived ?? 0, totalAmount }
}

export async function getUserActivity(userId: string): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const [{ data: jobs }, { data: reviews }, { data: tx }] = await Promise.all([
    supabase.from('job_postings').select('description, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(4),
    supabase.from('reviews').select('rating, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(4),
    supabase.from('transactions').select('total_amount, completed_at').eq('user_id', userId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(4),
  ])

  const items: ActivityItem[] = [
    ...(jobs ?? []).map((j) => ({ type: 'job_posted' as const, label: `Membuat permintaan: ${j.description.slice(0, 40)}`, date: j.created_at })),
    ...(reviews ?? []).map((r) => ({ type: 'review_given' as const, label: `Memberi review ${r.rating} bintang`, date: r.created_at })),
    ...(tx ?? []).filter((t) => t.completed_at).map((t) => ({ type: 'transaction_completed' as const, label: `Transaksi selesai — Rp${Number(t.total_amount ?? 0).toLocaleString('id-ID')}`, date: t.completed_at! })),
  ]

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4)
}

export async function getUmkmActivity(umkmId: string): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const [{ data: listings }, { data: reviews }, { data: tx }] = await Promise.all([
    supabase.from('listings').select('title, created_at').eq('umkm_id', umkmId).order('created_at', { ascending: false }).limit(4),
    supabase.from('reviews').select('rating, created_at').eq('umkm_id', umkmId).order('created_at', { ascending: false }).limit(4),
    supabase.from('transactions').select('total_amount, completed_at').eq('umkm_id', umkmId).eq('status', 'completed').order('completed_at', { ascending: false }).limit(4),
  ])

  const items: ActivityItem[] = [
    ...(listings ?? []).map((l) => ({ type: 'listing_created' as const, label: `Menambah katalog: ${l.title}`, date: l.created_at })),
    ...(reviews ?? []).map((r) => ({ type: 'review_received' as const, label: `Menerima review ${r.rating} bintang`, date: r.created_at })),
    ...(tx ?? []).filter((t) => t.completed_at).map((t) => ({ type: 'transaction_completed' as const, label: `Transaksi selesai — Rp${Number(t.total_amount ?? 0).toLocaleString('id-ID')}`, date: t.completed_at! })),
  ]

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4)
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateTrustScore } from '@/lib/trust-score'
import { redirect } from 'next/navigation'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactionId = formData.get('transactionId') as string
  const rating = Number(formData.get('rating'))
  const comment = formData.get('comment') as string

  if (!rating || rating < 1 || rating > 5) {
    return { error: 'Rating harus antara 1-5' }
  }

  const { data: transaction } = await supabase
    .from('transactions')
    .select('user_id, umkm_id, status, job_postings(category_id, categories(name))')
    .eq('id', transactionId)
    .single()

  if (!transaction) return { error: 'Transaksi tidak ditemukan' }
  if (transaction.user_id !== user.id) return { error: 'Tidak diizinkan' }
  if (transaction.status !== 'completed') return { error: 'Transaksi belum selesai' }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle()
  if (existing) return { error: 'Transaksi ini sudah direview' }

  // 1. Simpan review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      transaction_id: transactionId,
      user_id: user.id,
      umkm_id: transaction.umkm_id,
      rating,
      comment,
    })
    .select('id')
    .single()

  if (reviewError) return { error: reviewError.message }

  // 2. Bikin entri portofolio otomatis
  const categoryName = (transaction.job_postings as unknown as { categories: { name: string } | null })?.categories?.name ?? null

  await supabase.from('portfolio_entries').insert({
    umkm_id: transaction.umkm_id,
    transaction_id: transactionId,
    review_id: review.id,
    comment,
    category: categoryName,
  })

  // 3. Hitung ulang Trust Score & catat perubahan (auditability)
  const { data: umkmBefore } = await supabase
    .from('umkm_profiles')
    .select('trust_score')
    .eq('user_id', transaction.umkm_id)
    .single()

  const oldScore = umkmBefore?.trust_score ?? 0
  const result = await calculateTrustScore(transaction.umkm_id)

  await supabase
    .from('umkm_profiles')
    .update({ trust_score: result.total })
    .eq('user_id', transaction.umkm_id)

  await supabase.from('trust_score_logs').insert({
    umkm_id: transaction.umkm_id,
    change_amount: result.total - oldScore,
    new_score: result.total,
    source_type: 'review',
    source_id: review.id,
  })

  redirect(`/transactions/${transactionId}`)
}
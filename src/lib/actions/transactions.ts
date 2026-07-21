'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
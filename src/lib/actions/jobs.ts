'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createJobPosting(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.from('job_postings').insert({
    user_id: user.id,
    category_id: formData.get('categoryId') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    budget_min: Number(formData.get('budgetMin')) || null,
    budget_max: Number(formData.get('budgetMax')) || null,
    is_urgent: formData.get('isUrgent') === 'on',
    source: 'manual',
  }).select('id').single()

  if (error) return { error: error.message }

  redirect(`/job/${data.id}`)
}

export async function applyToJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jobPostingId = formData.get('jobPostingId') as string
  const comment = formData.get('comment') as string

  const { error } = await supabase.from('job_applications').insert({
    job_posting_id: jobPostingId,
    umkm_id: user.id,
    comment,
  })

  if (error) return { error: error.message }

  await supabase
    .from('job_postings')
    .update({ status: 'has_candidates' })
    .eq('id', jobPostingId)
    .eq('status', 'open')

  revalidatePath(`/job/${jobPostingId}`)
  return { success: true }
}

export async function acceptApplication(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const applicationId = formData.get('applicationId') as string
  const jobPostingId = formData.get('jobPostingId') as string
  const umkmId = formData.get('umkmId') as string

  // pastiin yang nge-accept emang pemilik job posting-nya
  const { data: job } = await supabase
    .from('job_postings')
    .select('user_id')
    .eq('id', jobPostingId)
    .single()

  if (!job || job.user_id !== user.id) {
    return { error: 'Tidak diizinkan' }
  }

  await supabase.from('job_applications').update({ status: 'accepted' }).eq('id', applicationId)
  await supabase
    .from('job_applications')
    .update({ status: 'rejected' })
    .eq('job_posting_id', jobPostingId)
    .neq('id', applicationId)

  await supabase.from('job_postings').update({ status: 'deal' }).eq('id', jobPostingId)

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({ job_posting_id: jobPostingId, user_id: user.id, umkm_id: umkmId })
    .select('id')
    .single()

  if (error) return { error: error.message }

  redirect(`/job/${jobPostingId}`)
}

export async function rejectApplication(formData: FormData) {
  const supabase = await createClient()
  const applicationId = formData.get('applicationId') as string
  const jobPostingId = formData.get('jobPostingId') as string

  await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', applicationId)

  revalidatePath(`/job/${jobPostingId}`)
}
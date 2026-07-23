'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createNotification } from '../notifications'
import { logActivity } from '../activity-log'

export async function createJobPosting(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const budgetMin = Number(formData.get('budgetMin')) || null
  const budgetMax = Number(formData.get('budgetMax')) || null
    
  if ((budgetMin && budgetMin < 0) || (budgetMax && budgetMax < 0)) {
    return { error: 'Budget gak boleh negatif' }
  }

  const { data, error } = await supabase.from('job_postings').insert({
    user_id: user.id,
    category_id: formData.get('categoryId') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    budget_min: budgetMin,
    budget_max: budgetMax,
    is_urgent: formData.get('isUrgent') === 'on',
    source: 'manual',
  }).select('id').single()

  if (error) return { error: error.message }

  const jobDescription = formData.get('description') as string
  const { data: posterData } = await supabase.from('users').select('full_name').eq('id', user.id).single()
  await logActivity(supabase, {
    userId: user.id,
    role: 'user',
    actionType: 'job_posted',
    description: `${posterData?.full_name ?? 'User'} membuat permintaan — ${jobDescription.slice(0, 40)}`,
  })

  redirect(`/job/${data.id}`)
}

export async function createJobPostingFromAi(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const description = formData.get('description') as string
  const location = formData.get('location') as string
  const categoryName = formData.get('categoryName') as string
  const budgetMin = Number(formData.get('budgetMin')) || null
  const budgetMax = Number(formData.get('budgetMax')) || null
  const isUrgent = formData.get('isUrgent') === 'true'

  let categoryId: string | null = null
  if (categoryName) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${categoryName}%`)
      .maybeSingle()
    categoryId = category?.id ?? null
  }

  const { data, error } = await supabase.from('job_postings').insert({
    user_id: user.id,
    category_id: categoryId,
    title: description.slice(0, 60),
    description,
    location,
    budget_min: budgetMin,
    budget_max: budgetMax,
    is_urgent: isUrgent,
    source: 'ai_chatbot',
    ai_extracted_data: { category: categoryName, description, location, budget_min: budgetMin, budget_max: budgetMax, is_urgent: isUrgent },
  }).select('id').single()

  if (error) return { error: error.message }

  const { data: userData } = await supabase.from('users').select('full_name').eq('id', user.id).single()
  await logActivity(supabase, {
    userId: user.id,
    role: 'user',
    actionType: 'job_posted',
    description: `${userData?.full_name ?? 'User'} membuat permintaan via AI Chat`,
  })

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

  const { data: job } = await supabase.from('job_postings').select('user_id, description').eq('id', jobPostingId).single()
  const { data: umkmProfile } = await supabase.from('umkm_profiles').select('business_name').eq('user_id', user.id).single()

  if (job) {
    await createNotification(supabase, {
      userId: job.user_id,
      type: 'job_application',
      title: 'Ada yang melamar pekerjaan kamu',
      body: `${umkmProfile?.business_name ?? 'UMKM'} melamar: ${job.description.slice(0, 50)}`,
      link: `/job/${jobPostingId}`,
    })
  }

  await logActivity(supabase, {
    userId: user.id,
    role: 'umkm',
    actionType: 'job_applied',
    description: `${umkmProfile?.business_name ?? 'UMKM'} melamar pekerjaan — ${job?.description?.slice(0, 40) ?? ''}`,
  })

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

  const { data: jobData } = await supabase
    .from('job_postings')
    .select('description')
    .eq('id', jobPostingId)
    .single()

  await supabase.from('job_postings').update({ status: 'deal' }).eq('id', jobPostingId)

  // cari conversation yang udah ada buat pasangan User-UMKM ini (biar gak dobel)
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .eq('umkm_id', umkmId)
    .maybeSingle()

  let conversationId: string

  if (existingConv) {
    conversationId = existingConv.id
    await supabase.from('conversations').update({ job_posting_id: jobPostingId }).eq('id', conversationId)
  } else {
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ job_posting_id: jobPostingId, user_id: user.id, umkm_id: umkmId })
      .select('id')
      .single()

    if (error) return { error: error.message }
    conversationId = newConv.id
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: `Deal untuk pekerjaan: "${jobData?.description ?? 'pekerjaan ini'}"`,
  })

  await createNotification(supabase, {
    userId: umkmId,
    type: 'application_accepted',
    title: 'Lamaran kamu diterima!',
    body: `Deal untuk: ${jobData?.description ?? 'pekerjaan ini'}`,
    link: `/job/${jobPostingId}`,
  })

  const { data: accepterData } = await supabase.from('users').select('full_name').eq('id', user.id).single()
  await logActivity(supabase, {
    userId: user.id,
    role: 'user',
    actionType: 'application_accepted',
    description: `${accepterData?.full_name ?? 'User'} deal untuk — ${jobData?.description?.slice(0, 40) ?? 'pekerjaan'}`,
  })

  redirect(`/job/${jobPostingId}`)
}

export async function rejectApplication(formData: FormData) {
  const supabase = await createClient()
  const applicationId = formData.get('applicationId') as string
  const jobPostingId = formData.get('jobPostingId') as string

  const { data: application } = await supabase.from('job_applications').select('umkm_id').eq('id', applicationId).single()

  await supabase.from('job_applications').update({ status: 'rejected' }).eq('id', applicationId)

  if (application) {
    const { data: job } = await supabase.from('job_postings').select('description').eq('id', jobPostingId).single()
    await createNotification(supabase, {
      userId: application.umkm_id,
      type: 'application_rejected',
      title: 'Lamaran kamu tidak dipilih',
      body: `Untuk: ${job?.description?.slice(0, 50) ?? 'pekerjaan ini'}`,
      link: `/job/${jobPostingId}`,
    })
  }

  revalidatePath(`/job/${jobPostingId}`)
}
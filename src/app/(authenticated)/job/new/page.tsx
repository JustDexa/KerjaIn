import { createClient } from '@/lib/supabase/server'
import { JobPostingForm } from '@/components/shared/job-posting-form'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id, name').eq('is_active', true)

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Buat Permintaan</h1>
      <JobPostingForm categories={categories ?? []} />
    </div>
  )
}
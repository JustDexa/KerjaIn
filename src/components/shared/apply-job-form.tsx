'use client'

import { useState } from 'react'
import { applyToJob } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ApplyJobForm({ jobPostingId }: { jobPostingId: string }) {
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(formData: FormData) {
    formData.set('jobPostingId', jobPostingId)
    const result = await applyToJob(formData)
    if (result?.error) setError(result.error)
    else setDone(true)
  }

  if (done) return <p className="text-sm text-green-600">Berhasil apply! Nunggu dipilih sama pemilik permintaan.</p>

  return (
    <form action={handleSubmit} className="space-y-3">
      <Textarea name="comment" placeholder="Kenalin diri lo & kenapa cocok buat kerjain ini..." rows={3} required />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit">Apply / Tawarkan Diri</Button>
    </form>
  )
}
'use client'

import { useState } from 'react'
import { createJobPostingFromAi } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

type Requirement = {
  category: string | null
  description: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  is_urgent: boolean
}

export function CreatePostingFromAiButton({ requirement }: { requirement: Requirement }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    setLoading(true)
    const formData = new FormData()
    formData.set('description', requirement.description ?? '')
    formData.set('location', requirement.location ?? '')
    formData.set('categoryName', requirement.category ?? '')
    if (requirement.budget_min) formData.set('budgetMin', String(requirement.budget_min))
    if (requirement.budget_max) formData.set('budgetMax', String(requirement.budget_max))
    formData.set('isUrgent', String(requirement.is_urgent))

    const result = await createJobPostingFromAi(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Membuat...' : (<><FileText className="mr-2 h-4 w-4" />Buat Posting dari Kebutuhan Ini</>)}
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
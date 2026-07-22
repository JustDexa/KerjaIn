'use client'

import { useState } from 'react'
import { markTransactionComplete } from '@/lib/actions/transactions'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export function MarkCompleteButton({ transactionId }: { transactionId: string }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Yakin pekerjaan ini udah selesai?')) return
    setLoading(true)
    const formData = new FormData()
    formData.set('transactionId', transactionId)
    const result = await markTransactionComplete(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Memproses...' : (<><CheckCircle2 className="mr-2 h-4 w-4" />Tandai Selesai</>)}
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
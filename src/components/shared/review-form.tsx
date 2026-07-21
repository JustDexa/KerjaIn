'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/actions/reviews'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ReviewForm({ transactionId }: { transactionId: string }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError('Pilih rating dulu (klik bintang)')
      return
    }
    formData.set('transactionId', transactionId)
    formData.set('rating', String(rating))
    const result = await submitReview(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl leading-none"
            >
              {(hovered || rating) >= star ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">Komentar</label>
        <Textarea id="comment" name="comment" rows={4} placeholder="Gimana pengalaman kerja sama UMKM ini?" required />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">Kirim Review</Button>
    </form>
  )
}
'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'
import { uploadFiles } from '@/lib/supabase/upload'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export function ReviewForm({ transactionId }: { transactionId: string }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError('Pilih rating dulu (klik bintang)')
      return
    }
    setUploading(true)
    setError('')

    if (photoFile) {
      const supabase = createClient()
      const { urls, error: uploadError } = await uploadFiles(supabase, [photoFile], 'public-photos', `reviews/${Date.now()}`)
      if (uploadError) {
        setUploading(false)
        setError(`Gagal upload foto: ${uploadError}`)
        return
      }
      formData.set('photoUrl', urls[0] ?? '')
    }

    formData.set('transactionId', transactionId)
    formData.set('rating', String(rating))
    const result = await submitReview(formData)
    setUploading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)} className="text-3xl leading-none">
              {(hovered || rating) >= star ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">Komentar</label>
        <Textarea id="comment" name="comment" rows={4} placeholder="Gimana pengalaman kerja sama UMKM ini?" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="photo" className="text-sm font-medium">Foto (opsional)</label>
        <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Mengunggah...' : 'Kirim Review'}</Button>
    </form>
  )
}
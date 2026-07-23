'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/actions/reviews'
import { createClient } from '@/lib/supabase/client'
import { uploadFiles } from '@/lib/supabase/upload'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Star, ImagePlus, X } from 'lucide-react'

const ratingLabels: Record<number, string> = {
  1: 'Buruk',
  2: 'Kurang',
  3: 'Cukup',
  4: 'Baik',
  5: 'Sangat Baik',
}

export function ReviewForm({ transactionId }: { transactionId: string }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

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

  const displayRating = hovered || rating

  return (
    <form action={handleSubmit} className="animate-fade-in-up space-y-5 rounded-xl border p-5">
      <div className="text-center">
        <p className="mb-3 text-sm font-medium">Beri rating</p>
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110"
            >
              <Star className={`h-8 w-8 ${displayRating >= star ? 'fill-rating text-rating' : 'text-muted-foreground/30'}`} />
            </button>
          ))}
        </div>
        {displayRating > 0 && (
          <p className="mt-2 animate-fade-in-up text-sm font-medium text-muted-foreground">{ratingLabels[displayRating]}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">Komentar</label>
        <Textarea id="comment" name="comment" rows={4} placeholder="Gimana pengalaman kerja sama UMKM ini?" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Foto (opsional)</label>
        {photoPreview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoPreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:bg-muted/30">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px]">Tambah Foto</span>
            <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90" disabled={uploading}>
        {uploading ? 'Mengunggah...' : 'Kirim Review'}
      </Button>
    </form>
  )
}
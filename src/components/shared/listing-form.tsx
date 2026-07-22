'use client'

import { useState } from 'react'
import { createListing, updateListing } from '@/lib/actions/listings'
import { createClient } from '@/lib/supabase/client'
import { uploadFiles } from '@/lib/supabase/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Listing = {
  id: string
  type: string
  transaction_type: string
  title: string
  description: string | null
  price: number | null
  price_unit: string | null
  estimated_duration: string | null
  photos: string[] | null
}

export function ListingForm({ existing }: { existing?: Listing }) {
  const [type, setType] = useState(existing?.type ?? 'jasa')
  const [transactionType, setTransactionType] = useState(existing?.transaction_type ?? 'one_time')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existing?.photos?.[0] ?? null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(formData: FormData) {
    setUploading(true)
    setError('')

    if (photoFile) {
      const supabase = createClient()
      const { urls, error: uploadError } = await uploadFiles(supabase, [photoFile], 'public-photos', `listings/${Date.now()}`)
      if (uploadError) {
        setUploading(false)
        setError(`Gagal upload foto: ${uploadError}`)
        return
      }
      formData.set('photoUrl', urls[0] ?? '')
    }

    formData.set('type', type)
    formData.set('transactionType', transactionType)
    if (existing) formData.set('id', existing.id)

    const action = existing ? updateListing : createListing
    const result = await action(formData)
    setUploading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="photo">Foto</Label>
        <div className="flex items-center gap-3">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview" className="size-16 rounded-md object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">Foto</div>
          )}
          <Input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="max-w-64" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" defaultValue={existing?.title ?? ''} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" defaultValue={existing?.description ?? ''} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipe</Label>
          <Select value={type} onValueChange={(value) => setType(value ?? 'jasa')}>
            <SelectTrigger>
              <SelectValue>{(value: string | null) => ({ jasa: 'Jasa', barang: 'Barang', custom_request: 'Custom Request' }[value ?? ''] ?? 'Pilih tipe')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jasa">Jasa</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
              <SelectItem value="custom_request">Custom Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Jenis Transaksi</Label>
          <Select value={transactionType} onValueChange={(value) => setTransactionType(value ?? 'one_time')}>
            <SelectTrigger>
              <SelectValue>{(value: string | null) => ({ one_time: 'One-time Job', project: 'Project', subscription: 'Subscription', rental: 'Rental' }[value ?? ''] ?? 'Pilih jenis transaksi')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-time Job</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="subscription">Subscription</SelectItem>
              <SelectItem value="rental">Rental</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input id="price" name="price" type="number" min="0" defaultValue={existing?.price ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceUnit">Satuan Harga</Label>
          <Input id="priceUnit" name="priceUnit" placeholder="mis. /jam, /hari, /unit" defaultValue={existing?.price_unit ?? ''} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedDuration">Estimasi Durasi</Label>
        <Input id="estimatedDuration" name="estimatedDuration" placeholder="mis. 2-3 jam" defaultValue={existing?.estimated_duration ?? ''} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={uploading}>{uploading ? 'Mengunggah...' : existing ? 'Simpan Perubahan' : 'Tambah Listing'}</Button>
    </form>
  )
}
'use client'

import { useState } from 'react'
import { createListing, updateListing } from '@/lib/actions/listings'
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
}

export function ListingForm({ existing }: { existing?: Listing }) {
  const [type, setType] = useState(existing?.type ?? 'jasa')
  const [transactionType, setTransactionType] = useState(existing?.transaction_type ?? 'one_time')
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('type', type)
    formData.set('transactionType', transactionType)
    const action = existing ? updateListing : createListing
    if (existing) formData.set('id', existing.id)
    const result = await action(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
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
<Select value={type} onValueChange={(value) => setType(value ?? 'jasa')}>            <SelectTrigger>
  <SelectValue>
    {(value: string | null) => ({ one_time: 'One-time Job', project: 'Project', subscription: 'Subscription', rental: 'Rental' }[value ?? ''] ?? 'Pilih jenis transaksi')}
  </SelectValue>
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
<Select value={transactionType} onValueChange={(value) => setTransactionType(value ?? 'one_time')}>            <SelectTrigger>
  <SelectValue>
    {(value: string | null) => ({ jasa: 'Jasa', barang: 'Barang', custom_request: 'Custom Request' }[value ?? ''] ?? 'Pilih tipe')}
  </SelectValue>
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
          <Input id="price" name="price" type="number" defaultValue={existing?.price ?? ''} />
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

      <Button type="submit">{existing ? 'Simpan Perubahan' : 'Tambah Listing'}</Button>
    </form>
  )
}
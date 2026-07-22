'use client'

import { useState } from 'react'
import { addListing } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function ListingForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [previews, setPreviews] = useState<string[]>([])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Bikin preview untuk semua foto yang dipilih
      const newPreviews = files.map(file => URL.createObjectURL(file))
      setPreviews(newPreviews)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMsg('')
    
    const result = await addListing(formData)
    
    if (result?.error) {
      setMsg(result.error)
    } else {
      setMsg('Listing berhasil ditambahkan ke katalog! ✔')
      setPreviews([])
      // Idealnya bisa reset form HTML di sini menggunakan ref
    }
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-6 rounded-lg border p-6 bg-card text-card-foreground shadow-sm">
      <h3 className="font-semibold text-lg">Tambah Listing Baru</h3>
      
      <div className="space-y-2">
        <Label htmlFor="photos">Foto Listing (Bisa lebih dari 1)</Label>
        <Input 
          id="photos" 
          name="photos" 
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          multiple // <-- Ini kuncinya biar bisa pilih banyak file
          onChange={handleFileChange}
          required 
        />
        {/* Gallery Preview */}
        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {previews.map((src, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={src} alt={`Preview ${idx}`} className="h-20 w-20 rounded-md object-cover border" />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul Listing</Label>
          <Input id="title" name="title" required placeholder="Mis. Jasa Pembuatan Website" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Kategori Utama</Label>
          <Select name="type" defaultValue="jasa">
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jasa">Jasa</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
              <SelectItem value="custom_request">Custom Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Lengkap</Label>
        <Textarea id="description" name="description" rows={4} required placeholder="Jelaskan detail layanan atau produk..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transactionType">Tipe Transaksi</Label>
          <Select name="transactionType" defaultValue="one_time">
            <SelectTrigger>
              <SelectValue placeholder="Pilih transaksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">Sekali Bayar</SelectItem>
              <SelectItem value="project">Berbasis Proyek</SelectItem>
              <SelectItem value="subscription">Langganan</SelectItem>
              <SelectItem value="rental">Sewa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input id="price" name="price" type="number" placeholder="500000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceUnit">Satuan Harga</Label>
          <Input id="priceUnit" name="priceUnit" placeholder="Mis. /Bulan, /Proyek" />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full md:w-auto">
        {loading ? 'Menyimpan ke Server...' : 'Simpan Listing'}
      </Button>

      {msg && (
        <p className={`text-sm font-medium ${msg.includes('error') || msg.includes('Gagal') ? 'text-destructive' : 'text-green-600'}`}>
          {msg}
        </p>
      )}
    </form>
  )
}
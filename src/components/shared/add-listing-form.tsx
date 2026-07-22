'use client'

import { useState } from 'react'
import { createListing } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function AddListingForm() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMsg('')
    
    const result = await createListing(formData)
    
    if (result?.error) {
      setMsg(result.error)
    } else {
      setMsg('Listing berhasil ditambahkan! ✔')
      setPreview(null)
      // Reset form bisa dilakukan di sini kalau perlu
    }
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold text-lg">Tambah Portofolio / Listing</h3>
      
      <div className="space-y-2">
        <Label htmlFor="listingPhoto">Foto Produk/Jasa</Label>
        <Input 
          id="listingPhoto" 
          name="listingPhoto" 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          required 
        />
        {/* Preview Foto */}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="mt-2 h-32 w-32 rounded object-cover" />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" required placeholder="Mis. Desain Logo Custom" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" required />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Mengunggah...' : 'Simpan Listing'}
      </Button>

      {msg && <p className="text-sm font-medium text-blue-600">{msg}</p>}
    </form>
  )
}
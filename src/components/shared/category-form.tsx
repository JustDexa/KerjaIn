'use client'

import { useState } from 'react'
import { createCategory, updateCategory } from '@/lib/actions/admin-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Category = { id: string; name: string; type: string }

export function CategoryForm({ existing, onDone }: { existing?: Category; onDone?: () => void }) {
  const [type, setType] = useState(existing?.type ?? 'jasa')
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('type', type)
    if (existing) formData.set('id', existing.id)
    const action = existing ? updateCategory : createCategory
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      onDone?.()
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Kategori</Label>
        <Input id="name" name="name" defaultValue={existing?.name ?? ''} required />
      </div>
      <div className="space-y-2">
        <Label>Tipe</Label>
        <Select value={type} onValueChange={(v) => setType(v ?? 'jasa')}>
          <SelectTrigger>
            <SelectValue>
              {(value: string | null) => ({ jasa: 'Jasa', barang: 'Barang', keduanya: 'Keduanya' }[value ?? ''] ?? 'Pilih tipe')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jasa">Jasa</SelectItem>
            <SelectItem value="barang">Barang</SelectItem>
            <SelectItem value="keduanya">Keduanya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full">{existing ? 'Simpan Perubahan' : 'Tambah Kategori'}</Button>
    </form>
  )
}
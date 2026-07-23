'use client'

import { useState } from 'react'
import { createJobPosting } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Category = { id: string; name: string }

export function JobPostingForm({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    if (!categoryId) {
      setError('Pilih kategori dulu')
      return
    }
    formData.set('categoryId', categoryId)
    if (isUrgent) formData.set('isUrgent', 'on')
    const result = await createJobPosting(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih kategori">
                {(value: string | null) => categories.find((c) => c.id === value)?.name ?? 'Pilih kategori'}
            </SelectValue>
            </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Judul</Label>
        <Input id="title" name="title" placeholder="mis. Butuh tukang servis AC" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Kebutuhan</Label>
        <Textarea id="description" name="description" rows={4} placeholder="Jelasin kebutuhan lo detail..." required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lokasi</Label>
        <Input id="location" name="location" placeholder="mis. Laweyan, Solo" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budgetMin">Budget Minimal (Rp)</Label>
          <Input id="budgetMin" name="budgetMin" type="number" min="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budgetMax">Budget Maksimal (Rp)</Label>
          <Input id="budgetMax" name="budgetMax" type="number" min="0" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(v) => setIsUrgent(v === true)} />
        <Label htmlFor="urgent">Urgent (butuh cepat)</Label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">Buat Permintaan</Button>
    </form>
  )
}
'use client'

import { useState } from 'react'
import { createUmkmProfile } from '@/lib/actions/umkm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'


type Category = { id: string; name: string }

export function OnboardingUmkmForm({ categories }: { categories: Category[] }) {
  const [offeringType, setOfferingType] = useState('jasa')
  const [serviceArea, setServiceArea] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    formData.set('offeringType', offeringType)
    formData.set('serviceArea', serviceArea)
    const result = await createUmkmProfile(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Nama Usaha</Label>
        <Input id="businessName" name="businessName" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi Usaha</Label>
        <Textarea id="description" name="description" rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Wilayah Layanan</Label>
        <Select value={serviceArea} onValueChange={(v) => setServiceArea(v ?? '')}>
          <SelectTrigger>
            <SelectValue>{(v: string | null) => v || 'Pilih wilayah'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Solo">Solo</SelectItem>
            <SelectItem value="Sukoharjo">Sukoharjo</SelectItem>
            <SelectItem value="Karanganyar">Karanganyar</SelectItem>
            <SelectItem value="Boyolali">Boyolali</SelectItem>
            <SelectItem value="Klaten">Klaten</SelectItem>
            <SelectItem value="Sragen">Sragen</SelectItem>
            <SelectItem value="Wonogiri">Wonogiri</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Jenis Penawaran</Label>
        <RadioGroup value={offeringType} onValueChange={setOfferingType} className="flex gap-4">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="jasa" id="offering-jasa" />
            <Label htmlFor="offering-jasa">Jasa</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="barang" id="offering-barang" />
            <Label htmlFor="offering-barang">Barang</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="keduanya" id="offering-keduanya" />
            <Label htmlFor="offering-keduanya">Keduanya</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>Kategori Usaha</Label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categories" value={cat.id} className="h-4 w-4 rounded border-gray-300" />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full">Simpan & Lanjut</Button>
    </form>
  )
}
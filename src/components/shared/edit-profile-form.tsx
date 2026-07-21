'use client'

import { useState } from 'react'
import { updateUserProfile, updateUmkmProfile } from '@/lib/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Props = {
  role: string
  userData: { full_name: string | null; phone: string | null }
  umkmData?: {
    business_name: string | null
    description: string | null
    service_area: string | null
    offering_type: string | null
    base_price_range: string | null
    operational_hours: string | null
  } | null
}

export function EditProfileForm({ role, userData, umkmData }: Props) {
  const [msg, setMsg] = useState('')
  const [offeringType, setOfferingType] = useState(umkmData?.offering_type ?? 'jasa')

  async function handleUserSubmit(formData: FormData) {
    const result = await updateUserProfile(formData)
    setMsg(result?.error ? `Error: ${result.error}` : 'Profil dasar tersimpan ✔')
  }

  async function handleUmkmSubmit(formData: FormData) {
    formData.set('offeringType', offeringType)
    const result = await updateUmkmProfile(formData)
    setMsg(result?.error ? `Error: ${result.error}` : 'Profil UMKM tersimpan ✔')
  }

  return (
    <div className="space-y-8">
      <form action={handleUserSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Data Dasar</h2>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input key={userData.full_name} id="fullName" name="fullName" defaultValue={userData.full_name ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">No. HP</Label>
          <Input id="phone" name="phone" defaultValue={userData.phone ?? ''} />
        </div>
        <Button type="submit">Simpan Data Dasar</Button>
      </form>

      {role === 'umkm' && (
        <>
          <Separator />
          <form action={handleUmkmSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold">Profil Usaha</h2>
            <div className="space-y-2">
              <Label htmlFor="businessName">Nama Usaha</Label>
              <Input id="businessName" name="businessName" defaultValue={umkmData?.business_name ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" name="description" defaultValue={umkmData?.description ?? ''} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceArea">Wilayah Layanan</Label>
              <Input id="serviceArea" name="serviceArea" defaultValue={umkmData?.service_area ?? ''} />
            </div>
            <div className="space-y-2">
              <Label>Jenis Penawaran</Label>
                  <Select key={umkmData?.offering_type} value={offeringType} onValueChange={(value) => setOfferingType(value ?? 'jasa')}>                <SelectContent>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="barang">Barang</SelectItem>
                  <SelectItem value="keduanya">Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePriceRange">Kisaran Harga Dasar</Label>
              <Input id="basePriceRange" name="basePriceRange" placeholder="mis. Rp50.000 - Rp300.000" defaultValue={umkmData?.base_price_range ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationalHours">Jam Operasional</Label>
              <Input id="operationalHours" name="operationalHours" placeholder="mis. 08.00 - 20.00" defaultValue={umkmData?.operational_hours ?? ''} />
            </div>
            <Button type="submit">Simpan Profil Usaha</Button>
          </form>
        </>
      )}

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  )
}
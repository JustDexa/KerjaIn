'use client'

import { useState } from 'react'
import { updateUserProfile, updateUmkmProfile } from '@/lib/actions/profile'
import { uploadFiles } from '@/lib/supabase/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'


type Props = {
  role: string
  userId: string
  userData: { full_name: string | null; phone: string | null; avatar_url?: string | null }
  umkmData?: {
    business_name: string | null
    description: string | null
    service_area: string | null
    offering_type: string | null
    base_price_range: string | null
    operational_hours: string | null
    banner_url?: string | null
  } | null
}

export function EditProfileForm({ role, userId, userData, umkmData }: Props) {
  const [msg, setMsg] = useState('')
  const [offeringType, setOfferingType] = useState(umkmData?.offering_type ?? 'jasa')
  const [serviceArea, setServiceArea] = useState(umkmData?.service_area ?? '')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userData.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(umkmData?.banner_url ?? null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

async function handleUserSubmit(formData: FormData) {
  setUploading(true)

  if (avatarFile) {
    const supabase = createClient()

    const { urls, error } = await uploadFiles(
      supabase,
      [avatarFile],
      'public-photos',
      `profiles/${userId}`
    )

    if (error) {
      setUploading(false)
      setMsg(`Error upload: ${error}`)
      return
    }

    if (urls.length > 0) {
      formData.set('avatarUrl', urls[0])
    }
  }

  const result = await updateUserProfile(formData)

  setUploading(false)
  setMsg(result?.error ? `Error: ${result.error}` : 'Profil dasar tersimpan ✔')
}

  async function handleUmkmSubmit(formData: FormData) {
    formData.set('offeringType', offeringType)
    formData.set('serviceArea', serviceArea)
    if (priceMin || priceMax) {
      formData.set('basePriceRange', `Rp${Number(priceMin || 0).toLocaleString('id-ID')} - Rp${Number(priceMax || 0).toLocaleString('id-ID')}`)
    }

    if (bannerFile) {
      const supabase = createClient()
      const { urls, error } = await uploadFiles(supabase, [bannerFile], 'public-photos', `banners/${userId}`)
      if (error) {
        setMsg(`Error upload banner: ${error}`)
        return
      }
      formData.set('bannerUrl', urls[0] ?? '')
    }

    const result = await updateUmkmProfile(formData)
    setMsg(result?.error ? `Error: ${result.error}` : 'Profil UMKM tersimpan ✔')
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  return (
    <div className="space-y-8">
      <form action={handleUserSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Data Dasar</h2>
        <div className="space-y-2">
          <Label htmlFor="avatar">Foto Profil</Label>
          <div className="flex items-center gap-3">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Preview" className="size-14 rounded-full object-cover" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                Foto
              </div>
            )}
            <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="max-w-64" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input key={userData.full_name} id="fullName" name="fullName" defaultValue={userData.full_name ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">No. HP</Label>
          <Input key={userData.phone ?? 'phone'} id="phone" name="phone" defaultValue={userData.phone ?? ''} />
        </div>
        <Button type="submit" disabled={uploading}>{uploading ? 'Mengunggah...' : 'Simpan Data Dasar'}</Button>
      </form>

      {role === 'umkm' && (
        <>
          <Separator />
          <form action={handleUmkmSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold">Profil Usaha</h2>
            <div className="space-y-2">
              <Label htmlFor="banner">Foto Banner (opsional)</Label>
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerPreview} alt="Preview banner" className="h-24 w-full rounded-md object-cover" />
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  Belum ada banner — otomatis pakai gradient default
                </div>
              )}
              <Input id="banner" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBannerChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Nama Usaha</Label>
              <Input id="businessName" name="businessName" defaultValue={umkmData?.business_name ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" name="description" defaultValue={umkmData?.description ?? ''} rows={3} />
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
                  <Select key={umkmData?.offering_type} value={offeringType} onValueChange={(value) => setOfferingType(value ?? 'jasa')}>
                <SelectTrigger>
                  <SelectValue>
                    {(value: string | null) => ({ jasa: 'Jasa', barang: 'Barang', keduanya: 'Keduanya' }[value ?? ''] ?? 'Pilih jenis penawaran')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jasa">Jasa</SelectItem>
                  <SelectItem value="barang">Barang</SelectItem>
                  <SelectItem value="keduanya">Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kisaran Harga Dasar</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" min="0" placeholder="Harga minimal" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                <Input type="number" min="0" placeholder="Harga maksimal" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
              </div>
              {umkmData?.base_price_range && !priceMin && !priceMax && (
                <p className="text-xs text-muted-foreground">Saat ini: {umkmData.base_price_range}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationalHours">Jam Operasional</Label>
              <Input key={umkmData?.operational_hours ?? 'hours'} id="operationalHours" name="operationalHours" placeholder="mis. 08.00 - 20.00" defaultValue={umkmData?.operational_hours ?? ''} />
            </div>
            <Button type="submit">Simpan Profil Usaha</Button>
          </form>
        </>
      )}

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  )
}
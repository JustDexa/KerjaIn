'use client'

import { useState } from 'react'
import { uploadFiles } from '@/lib/supabase/upload' 
import { submitVerificationDocs } from '@/lib/actions/verifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default function VerificationPage() {
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ktpFile || !selfieFile) return alert('Pilih foto KTP dan Selfie dulu.')

    setLoading(true)
    try {
      // 1. Panggil helper upload (gunakan as unknown untuk bypass type checker dengan aman)
      const ktpRes = await uploadFiles([ktpFile], 'verification-docs', 'ktp') as unknown
      const selfieRes = await uploadFiles([selfieFile], 'verification-docs', 'selfie') as unknown

      console.log('HASIL UPLOAD KTP:', ktpRes)
      console.log('HASIL UPLOAD SELFIE:', selfieRes)

      // 2. Fungsi ekstraktor menggunakan tipe unknown dan type narrowing
      const extractUrl = (res: unknown): string | null => {
        if (!res) return null
        if (typeof res === 'string') return res
        if (Array.isArray(res)) return typeof res[0] === 'string' ? res[0] : null
        
        if (typeof res === 'object') {
          // Cast ke objek standar untuk mengecek properti di dalamnya
          const obj = res as Record<string, unknown>
          if (Array.isArray(obj.urls) && typeof obj.urls[0] === 'string') return obj.urls[0]
          if (Array.isArray(obj.paths) && typeof obj.paths[0] === 'string') return obj.paths[0]
          if (Array.isArray(obj.data) && typeof obj.data[0] === 'string') return obj.data[0]
        }
        return null
      }

      const finalKtpUrl = extractUrl(ktpRes)
      const finalSelfieUrl = extractUrl(selfieRes)

      if (!finalKtpUrl || !finalSelfieUrl) {
        alert('Gagal mengekstrak URL gambar. Cek F12 Console untuk melihat detail error.')
        setLoading(false)
        return
      }

      // 3. Simpan ke database
      await submitVerificationDocs(finalKtpUrl, finalSelfieUrl)
      
      alert('Dokumen berhasil dikirim!')
      router.push('/profile')
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan sistem saat mengirim dokumen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded-lg shadow-sm">
      <h1 className="text-xl font-bold mb-4">Verifikasi KTP</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Foto KTP</label>
          <Input type="file" accept="image/*" onChange={(e) => setKtpFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Foto Selfie dengan KTP</label>
          <Input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Mengunggah...' : 'Kirim Verifikasi'}
        </Button>
      </form>
    </div>
  )
}
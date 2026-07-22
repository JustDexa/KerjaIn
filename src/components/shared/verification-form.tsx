'use client'

import { useState } from 'react'
import { submitVerification } from '@/lib/actions/verification'
import { createClient } from '@/lib/supabase/client'
import { uploadFiles } from '@/lib/supabase/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VerificationForm({ userId }: { userId: string }) {
  const [ktpFile, setKtpFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!ktpFile || !selfieFile) {
      setError('Upload foto KTP dan selfie dulu')
      return
    }
    setUploading(true)
    setError('')

    const supabase = createClient()
    const { urls, error: uploadError } = await uploadFiles(supabase, [ktpFile, selfieFile], 'verification-docs', userId)

    if (uploadError) {
      setUploading(false)
      setError(uploadError)
      return
    }

    const formData = new FormData()
    formData.set('ktpUrl', urls[0])
    formData.set('selfieUrl', urls[1])
    const result = await submitVerification(formData)

    setUploading(false)
    if (result?.error) setError(result.error)
    else setDone(true)
  }

  if (done) return <p className="text-sm text-green-600">Dokumen berhasil dikirim, menunggu review admin.</p>

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ktp">Foto KTP</Label>
        <Input id="ktp" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setKtpFile(e.target.files?.[0] ?? null)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="selfie">Foto Selfie (pegang KTP)</Label>
        <Input id="selfie" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={uploading}>{uploading ? 'Mengunggah...' : 'Kirim Verifikasi'}</Button>
    </div>
  )
}
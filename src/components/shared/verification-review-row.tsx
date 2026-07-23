'use client'

import { useState } from 'react'
import { approveVerification, rejectVerification } from '@/lib/actions/admin-verification'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

type Doc = { id: string; user_id: string; full_name: string | null; role: string | null; ktp_photo_url: string | null; selfie_photo_url: string | null }

export function VerificationReviewRow({ doc }: { doc: Doc }) {
  const [showReject, setShowReject] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    setLoading(true)
    const formData = new FormData()
    formData.set('id', doc.id)
    formData.set('userId', doc.user_id)
    await approveVerification(formData)
    setLoading(false)
    setDone(true)
  }

  async function handleReject() {
    setLoading(true)
    const formData = new FormData()
    formData.set('id', doc.id)
    formData.set('note', note)
    await rejectVerification(formData)
    setLoading(false)
    setDone(true)
  }

  if (done) return null

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{doc.full_name ?? 'Pengguna'}</p>
          {doc.role && <span className="rounded-full border px-2 py-0.5 text-xs capitalize">{doc.role}</span>}
        </div>
        <div className="flex gap-2">
          {doc.ktp_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.ktp_photo_url} alt="KTP" className="h-32 rounded-md object-cover" />
          )}
          {doc.selfie_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.selfie_photo_url} alt="Selfie" className="h-32 rounded-md object-cover" />
          )}
        </div>

        {!showReject ? (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleApprove} disabled={loading}>Setujui</Button>
            <Button size="sm" variant="outline" onClick={() => setShowReject(true)} disabled={loading}>Tolak</Button>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <Textarea placeholder="Alasan penolakan..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading || !note}>Kirim Penolakan</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Batal</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
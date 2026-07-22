/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server'
import { reviewVerification } from '@/lib/actions/verifications'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default async function AdminVerificationsPage() {
  const supabase = await createClient() // <-- Tambah await di sini
  
  const { data: docs } = await supabase
    .from('verification_documents')
    .select(`*, users ( full_name, email )`)
    .eq('status', 'pending')

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from('verification-docs').createSignedUrl(path, 3600)
    return data?.signedUrl
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Review Verifikasi Dokumen</h1>
      <div className="grid gap-6">
        {/* Tambah tipe any pada doc */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {docs?.map(async (doc: any) => {
          const ktpUrl = await getSignedUrl(doc.ktp_photo_url)
          const selfieUrl = await getSignedUrl(doc.selfie_photo_url)

          return (
            <Card key={doc.id} className="p-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{doc.users?.full_name}</h3>
                <p className="text-sm text-gray-500">{doc.users?.email}</p>
                <div className="flex gap-4 mt-4">
                  <div>
                    <p className="text-xs font-medium mb-1">KTP</p>
                    {ktpUrl && <img src={ktpUrl} alt="KTP" className="w-48 h-auto rounded border" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Selfie</p>
                    {selfieUrl && <img src={selfieUrl} alt="Selfie" className="w-48 h-auto rounded border" />}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 justify-center">
                <form action={async () => {
                  'use server'
                  await reviewVerification(doc.id, doc.user_id, true)
                }}>
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                </form>
                
                <form action={async (formData) => {
                  'use server'
                  const note = formData.get('note') as string
                  await reviewVerification(doc.id, doc.user_id, false, note)
                }}>
                  <input type="text" name="note" placeholder="Alasan penolakan" className="border text-sm p-2 rounded mb-2 w-full" required />
                  <Button type="submit" variant="destructive" className="w-full">Reject</Button>
                </form>
              </div>
            </Card>
          )
        })}
        {docs?.length === 0 && <p>Tidak ada dokumen yang perlu di-review.</p>}
      </div>
    </div>
  )
}
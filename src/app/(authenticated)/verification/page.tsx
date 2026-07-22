import { createClient } from '@/lib/supabase/server'
import { VerificationForm } from '@/components/shared/verification-form'

export default async function VerificationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: latest } = await supabase
    .from('verification_documents')
    .select('status')
    .eq('user_id', user!.id)
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-2xl font-bold">Verifikasi Identitas</h1>
      <p className="mb-6 text-sm text-muted-foreground">Upload KTP dan selfie buat naikkan kepercayaan profil kamu.</p>

      {latest?.status === 'pending' ? (
        <p className="text-sm text-muted-foreground">Dokumen sedang direview admin.</p>
      ) : latest?.status === 'verified' ? (
        <p className="text-sm text-green-600">Identitas kamu sudah terverifikasi.</p>
      ) : (
        <VerificationForm userId={user!.id} />
      )}
    </div>
  )
}
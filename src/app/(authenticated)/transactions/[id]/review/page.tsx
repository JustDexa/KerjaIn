import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ReviewForm } from '@/components/shared/review-form'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transaction } = await supabase
    .from('transactions')
    .select('user_id, status, umkm_profiles(business_name)')
    .eq('id', id)
    .single()

  if (!transaction) notFound()
  if (transaction.user_id !== user.id) notFound()
  if (transaction.status !== 'completed') redirect(`/transactions/${id}`)

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('transaction_id', id)
    .maybeSingle()
  if (existing) redirect(`/transactions/${id}`)

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-bold">Beri Review</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Buat {(transaction.umkm_profiles as unknown as { business_name: string }[])?.[0]?.business_name}
        </p> 
      <ReviewForm transactionId={id} />
    </div>
  )
}
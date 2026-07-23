import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ReviewForm } from '@/components/shared/review-form'
import { Card, CardContent } from '@/components/ui/card'

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transaction } = await supabase
    .from('transactions')
    .select('user_id, status, umkm_profiles(business_name, banner_url, users(avatar_url))')
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

  const umkmProfile = Array.isArray(transaction.umkm_profiles) ? transaction.umkm_profiles[0] : transaction.umkm_profiles
  const umkmUsers = Array.isArray(umkmProfile?.users) ? umkmProfile.users[0] : umkmProfile?.users

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="animate-fade-in-up">
        <h1 className="mb-6 text-2xl font-bold">Beri Review</h1>
      </div>

      <Card className="mb-6 animate-fade-in-up overflow-hidden pt-0">
        {umkmProfile?.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={umkmProfile.banner_url} alt="" className="h-16 w-full object-cover" />
        ) : (
          <div className="h-16 w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
        <CardContent className="-mt-6 flex items-center gap-3 pt-0">
          {umkmUsers?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={umkmUsers.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full border-2 border-background object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-medium text-background">
              {umkmProfile?.business_name?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Bagaimana pengalaman kamu dengan</p>
            <p className="font-semibold">{umkmProfile?.business_name}</p>
          </div>
        </CardContent>
      </Card>

      <ReviewForm transactionId={id} />
    </div>
  )
}
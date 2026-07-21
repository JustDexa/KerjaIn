import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/shared/checkout-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { paymentStatusLabel } from '@/lib/status-labels'

export default async function CheckoutPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, job_postings(description), umkm_profiles(business_name)')
    .eq('id', transactionId)
    .single()

  if (!transaction) notFound()
  if (transaction.user_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{transaction.job_postings?.description?.slice(0, 80)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">UMKM: {transaction.umkm_profiles?.business_name}</p>
          <p className="text-sm font-medium">
            Total: Rp{Number(transaction.total_amount ?? 0).toLocaleString('id-ID')}
          </p>
          <Badge variant={transaction.payment_status === 'paid' ? 'default' : 'secondary'}>
            {paymentStatusLabel(transaction.payment_status)}
          </Badge>
        </CardContent>
      </Card>

      {transaction.payment_status === 'pending' && (
        <CheckoutForm transactionId={transaction.id} totalAmount={Number(transaction.total_amount ?? 0)} />
      )}

      {transaction.payment_status !== 'pending' && (
        <div className="space-y-3">
          <p className="text-sm text-green-600">
            {transaction.payment_status === 'paid' ? 'Pembayaran lunas ✔' : 'DP sudah dibayar ✔'}
          </p>
          <Link href={`/job/${transaction.job_posting_id}`}>
            <Button variant="outline">Kembali ke Detail Job</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
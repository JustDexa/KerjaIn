import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CheckoutForm } from '@/components/shared/checkout-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { paymentStatusLabel } from '@/lib/status-labels'
import { CheckCircle2 } from 'lucide-react'
import { payRemainingBalance } from '@/lib/actions/payments'

export default async function CheckoutPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

// ganti select-nya jadi:
  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, job_postings(description), listings(title), umkm_profiles(business_name)')
    .eq('id', transactionId)
    .single()

  if (!transaction) notFound()
  if (transaction.user_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      <Card className="mb-6">
        <CardHeader>
      <CardTitle className="text-base">
        {transaction.job_postings?.description?.slice(0, 80) ?? transaction.listings?.title ?? 'Transaksi'}
      </CardTitle>
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

    {transaction.payment_status === 'dp_paid' && (
        <div className="space-y-3">
          <p className="text-sm text-yellow-600">DP sudah dibayar. Sisa: Rp{(Number(transaction.total_amount ?? 0) - Number(transaction.dp_amount ?? 0)).toLocaleString('id-ID')}</p>
          <form action={async (formData) => {
            'use server'
            await payRemainingBalance(formData)
          }}>
            <input type="hidden" name="transactionId" value={transaction.id} />
            <Button type="submit">Lunasi Sisa Pembayaran</Button>
          </form>
        </div>
      )}

      {transaction.payment_status === 'paid' && (
        <div className="space-y-3">
          <p className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />Pembayaran lunas</p>
          <Link href={transaction.job_posting_id ? `/job/${transaction.job_posting_id}` : `/transactions/${transaction.id}`}>
            <Button variant="outline">
              {transaction.job_posting_id ? 'Kembali ke Detail Job' : 'Lihat Detail Transaksi'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
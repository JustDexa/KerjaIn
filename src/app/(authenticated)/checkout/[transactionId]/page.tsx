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
    .select('*, job_postings(description), listings(title), umkm_profiles(business_name, banner_url, users(avatar_url))')
    .eq('id', transactionId)
    .single()

  const { data: items } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', transactionId)

  if (!transaction) notFound()
  if (transaction.user_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

<Card className="mb-6 animate-fade-in-up overflow-hidden">
        {transaction.umkm_profiles?.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={transaction.umkm_profiles.banner_url} alt="" className="h-20 w-full object-cover" />
        ) : (
          <div className="h-20 w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
        )}
        <CardHeader className="-mt-6 border-b bg-muted/30 pt-0">
          <div className="flex items-center gap-3">
            {transaction.umkm_profiles?.users?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={transaction.umkm_profiles.users.avatar_url} alt={transaction.umkm_profiles.business_name ?? ''} className="h-10 w-10 shrink-0 rounded-full border-2 border-background object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-medium text-background">
                {transaction.umkm_profiles?.business_name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {transaction.job_postings?.description?.slice(0, 80) ?? transaction.listings?.title ?? 'Transaksi'}
              </CardTitle>
              <p className="truncate text-sm text-muted-foreground">{transaction.umkm_profiles?.business_name}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {items && items.length > 0 && (
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.title}{item.quantity > 1 ? ` x${item.quantity}` : ''}</span>
                  <span>Rp{Number(item.subtotal ?? 0).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}
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
        <div className="animate-fade-in-up flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/5 py-10 text-center">
          <div className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-success">
            <CheckCircle2 className="h-9 w-9 text-success-foreground" />
          </div>
          <div>
            <p className="text-lg font-bold text-success">Pembayaran Lunas!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Terima kasih, transaksi kamu sudah selesai diproses.
            </p>
          </div>
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
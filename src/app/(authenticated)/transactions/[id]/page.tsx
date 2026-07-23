import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkCompleteButton } from '@/components/shared/mark-complete-button'
import { transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'
import { CheckCircle2, Star } from 'lucide-react'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, umkm_profiles(business_name, user_id), users(full_name), job_postings(description, location)')
    .eq('id', id)
    .single()

  if (!transaction) notFound()
  if (transaction.user_id !== user.id && transaction.umkm_id !== user.id) notFound()

  const isUser = transaction.user_id === user.id
  const otherPartyName = isUser ? transaction.umkm_profiles?.business_name : transaction.users?.full_name

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_id', id)
    .order('paid_at', { ascending: true })

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('transaction_id', id)
    .maybeSingle()

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Detail Transaksi</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">{transaction.job_postings?.description?.slice(0, 80)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">📍 {transaction.job_postings?.location}</p>
          <p className="text-sm text-muted-foreground">Dengan: {otherPartyName}</p>
          <p className="text-sm font-medium">Total: Rp{Number(transaction.total_amount ?? 0).toLocaleString('id-ID')}</p>
          <div className="flex gap-2">
            <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
              {transactionStatusLabel(transaction.status)}
            </Badge>
            <Badge variant="outline">{paymentStatusLabel(transaction.payment_status)}</Badge>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Riwayat Pembayaran</h2>
      <div className="mb-6 space-y-2">
        {(!payments || payments.length === 0) && <p className="text-sm text-muted-foreground">Belum ada pembayaran.</p>}
        {payments?.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm font-medium">Rp{Number(p.amount).toLocaleString('id-ID')} ({p.type})</p>
                <p className="text-xs text-muted-foreground">
                  {p.paid_at ? new Date(p.paid_at).toLocaleString('id-ID') : '-'}
                </p>
              </div>
              <Badge variant="outline">{p.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {transaction.status === 'in_progress' && transaction.payment_status === 'paid' && !isUser && (
        <MarkCompleteButton transactionId={transaction.id} />
      )}

      {transaction.status === 'completed' && isUser && !existingReview && (
        <Link href={`/transactions/${transaction.id}/review`}>
          <Button><Star className="mr-2 h-4 w-4" />Beri Review</Button>
        </Link>
      )}

      {transaction.status === 'completed' && existingReview && (
        <p className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" />Review sudah diberikan</p>
      )}

      {transaction.payment_status === 'pending' && (
        <Link href={`/checkout/${transaction.id}`}>
          <Button variant="outline">Lanjutkan Pembayaran</Button>
        </Link>
      )}
    </div>
  )
}
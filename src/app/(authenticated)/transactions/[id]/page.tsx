import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarkCompleteButton } from '@/components/shared/mark-complete-button'
import { transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'
import { CheckCircle2, Star, MapPin, Wallet, CreditCard, Landmark, ShoppingBag } from 'lucide-react'

const paymentTypeIcon: Record<string, typeof CreditCard> = {
  full: CreditCard,
  dp: Landmark,
  milestone: Landmark,
  deposit: Landmark,
  subscription: CreditCard,
}

const paymentTypeLabel: Record<string, string> = {
  full: 'Pembayaran Penuh',
  dp: 'Down Payment',
  milestone: 'Pelunasan',
  deposit: 'Deposit',
  subscription: 'Langganan',
}

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, umkm_profiles(business_name, user_id, banner_url, users(avatar_url)), users(full_name, avatar_url), job_postings(description, location)')
    .eq('id', id)
    .single()

  if (!transaction) notFound()
  if (transaction.user_id !== user.id && transaction.umkm_id !== user.id) notFound()

  const isUser = transaction.user_id === user.id
  const otherPartyName = isUser ? transaction.umkm_profiles?.business_name : transaction.users?.full_name
  const umkmAvatar = Array.isArray(transaction.umkm_profiles?.users) ? transaction.umkm_profiles?.users[0]?.avatar_url : transaction.umkm_profiles?.users?.avatar_url
  const otherPartyAvatar = isUser ? umkmAvatar : transaction.users?.avatar_url

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
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <ShoppingBag className="h-6 w-6" />Detail Transaksi
      </h1>

      <Card className={`mb-4 animate-fade-in-up overflow-hidden ${isUser ? 'pt-0' : ''}`}>
        {isUser && (
          transaction.umkm_profiles?.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={transaction.umkm_profiles.banner_url} alt="" className="h-20 w-full object-cover" />
          ) : (
            <div className="h-20 w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
          )
        )}
        <CardHeader className={isUser ? '-mt-6 pt-0' : ''}>
          <div className="flex items-center gap-3">
            {otherPartyAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherPartyAvatar} alt={otherPartyName ?? ''} className={`h-10 w-10 shrink-0 rounded-full object-cover ${isUser ? 'border-2 border-background' : ''}`} />
            ) : (
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background ${isUser ? 'border-2 border-background' : ''}`}>
                {otherPartyName?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{transaction.job_postings?.description?.slice(0, 60)}</CardTitle>
              <p className="truncate text-sm text-muted-foreground">Dengan: {otherPartyName}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {transaction.job_postings?.location && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />{transaction.job_postings.location}
            </p>
          )}
          <div className="flex items-center gap-1.5 rounded-md bg-accent-brand/5 p-2">
            <Wallet className="h-4 w-4 text-accent-brand" />
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="ml-auto text-base font-bold text-accent-brand">
              Rp{Number(transaction.total_amount ?? 0).toLocaleString('id-ID')}
            </span>
          </div>
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
        {(!payments || payments.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">Belum ada pembayaran.</CardContent>
          </Card>
        )}
        {payments?.map((p, index) => {
          const Icon = paymentTypeIcon[p.type] ?? CreditCard
          return (
            <Card
              key={p.id}
              className="animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <Icon className="h-4.5 w-4.5 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">Rp{Number(p.amount).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-muted-foreground">
                    {paymentTypeLabel[p.type] ?? p.type} · {p.paid_at ? new Date(p.paid_at).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
                <Badge variant={p.status === 'success' ? 'default' : 'outline'} className="shrink-0 capitalize">
                  {p.status === 'success' ? 'Berhasil' : p.status}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {transaction.status === 'in_progress' && transaction.payment_status === 'paid' && !isUser && (
        <MarkCompleteButton transactionId={transaction.id} />
      )}

      {transaction.status === 'completed' && isUser && !existingReview && (
        <Link href={`/transactions/${transaction.id}/review`}>
          <Button className="bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90"><Star className="mr-2 h-4 w-4" />Beri Review</Button>
        </Link>
      )}

      {transaction.status === 'completed' && existingReview && (
        <p className="flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" />Review sudah diberikan</p>
      )}

      {transaction.payment_status === 'pending' && (
        <Link href={`/checkout/${transaction.id}`}>
          <Button variant="outline">Lanjutkan Pembayaran</Button>
        </Link>
      )}
    </div>
  )
}
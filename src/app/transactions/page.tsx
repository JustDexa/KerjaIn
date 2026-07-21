import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: asUser } = await supabase
    .from('transactions')
    .select('*, umkm_profiles(business_name), job_postings(description)')
    .eq('user_id', user!.id)

  const { data: asUmkm } = await supabase
    .from('transactions')
    .select('*, users(full_name), job_postings(description)')
    .eq('umkm_id', user!.id)

  const combined = [
    ...(asUser ?? []).map((t) => ({ ...t, otherPartyName: t.umkm_profiles?.business_name ?? 'UMKM' })),
    ...(asUmkm ?? []).map((t) => ({ ...t, otherPartyName: t.users?.full_name ?? 'User' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Riwayat Transaksi</h1>

      {combined.length === 0 && <p className="text-muted-foreground">Belum ada transaksi.</p>}

      <div className="space-y-3">
        {combined.map((t) => (
          <Link key={t.id} href={`/transactions/${t.id}`}>
            <Card className="hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t.job_postings?.description?.slice(0, 60) ?? 'Transaksi'}</CardTitle>
                <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
                  {transactionStatusLabel(t.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Dengan: {t.otherPartyName}</p>
                <p className="text-sm">Rp{Number(t.total_amount ?? 0).toLocaleString('id-ID')} · {paymentStatusLabel(t.payment_status)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { calculateTrustScore } from '@/lib/trust-score'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TrustScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await calculateTrustScore(user!.id)

  const { data: logs } = await supabase
    .from('trust_score_logs')
    .select('*')
    .eq('umkm_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Trust Score Saya</h1>

      <Card className="mb-6">
        <CardContent className="pt-6 text-center">
          <p className="text-5xl font-bold">{result.total}</p>
          <p className="text-sm text-muted-foreground">dari 100</p>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-lg font-semibold">Rincian Skor</h2>
      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm"><span>Rating rata-rata ({result.avgRating}/5, {result.totalReviews} review)</span><span>{result.breakdown.rating}/50</span></div>
        <div className="flex justify-between text-sm"><span>Jumlah pekerjaan selesai</span><span>{result.breakdown.completion}/20</span></div>
        <div className="flex justify-between text-sm"><span>Repeat customer</span><span>{result.breakdown.repeatCustomer}/15</span></div>
        <div className="flex justify-between text-sm"><span>Verifikasi identitas</span><span>{result.breakdown.verification}/15</span></div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Riwayat Perubahan</h2>
      <div className="space-y-2">
        {(!logs || logs.length === 0) && <p className="text-sm text-muted-foreground">Belum ada perubahan.</p>}
        {logs?.map((log) => (
          <Card key={log.id}>
            <CardContent className="flex items-center justify-between pt-4 text-sm">
              <span>{log.change_amount >= 0 ? '+' : ''}{log.change_amount} poin (dari review)</span>
              <span className="text-muted-foreground">{new Date(log.created_at).toLocaleDateString('id-ID')}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
/* eslint-disable react-hooks/purity */
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { generateImpactInsight } from '@/lib/ai/impact-insight'
import { ImpactFilters } from '@/components/shared/impact-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wallet, CheckCircle2, Store, ShieldCheck, Lightbulb } from 'lucide-react'

const periodLabels: Record<string, string> = { '7': '7 hari terakhir', '30': '30 hari terakhir', '90': '90 hari terakhir' }

export default async function AdminImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; category?: string }>
}) {
  const { period = '30', category } = await searchParams
  const supabase = await createClient()

  const startDate = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString()

  const { data: categories } = await supabase.from('categories').select('id, name').eq('is_active', true)

  // Transaksi selesai dalam periode, join ke job_postings buat filter kategori
  let transactionsQuery = supabase
    .from('transactions')
    .select('id, total_amount, umkm_id, job_postings!inner(category_id)')
    .eq('status', 'completed')
    .gte('completed_at', startDate)

  if (category) transactionsQuery = transactionsQuery.eq('job_postings.category_id', category)

  const { data: transactions } = await transactionsQuery

  const totalValue = (transactions ?? []).reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0)
  const completedJobs = transactions?.length ?? 0
  const affectedUmkm = new Set((transactions ?? []).map((t) => t.umkm_id)).size

  // Rata-rata trust score, difilter kategori kalau ada
  const trustScoreQuery = category
    ? supabase.from('umkm_profiles').select('trust_score, umkm_categories!inner(category_id)').eq('umkm_categories.category_id', category)
    : supabase.from('umkm_profiles').select('trust_score')

  const { data: trustScores } = await trustScoreQuery
  const avgTrustScore = trustScores && trustScores.length > 0
    ? Math.round(trustScores.reduce((sum, t) => sum + Number(t.trust_score ?? 0), 0) / trustScores.length)
    : 0

  // Tabel detail job posting
  let jobsQuery = supabase
    .from('job_postings')
    .select('id, description, is_urgent, status, created_at, categories(name)')
    .gte('created_at', startDate)
    .order('created_at', { ascending: false })
    .limit(20)

  if (category) jobsQuery = jobsQuery.eq('category_id', category)

  const { data: jobs } = await jobsQuery

  const categoryLabel = category ? categories?.find((c) => c.id === category)?.name ?? 'Kategori terpilih' : 'Semua Kategori'

  const insight = await generateImpactInsight({
    totalValue,
    completedJobs,
    affectedUmkm,
    avgTrustScore,
    periodLabel: periodLabels[period] ?? '30 hari terakhir',
    categoryLabel,
  })

  const statusLabels: Record<string, string> = {
    open: 'Terbuka', has_candidates: 'Ada Pelamar', deal: 'Deal', completed: 'Selesai', closed: 'Ditutup',
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Impact Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">Dampak platform KerjaIn terhadap ekosistem UMKM Solo Raya</p>

      <ImpactFilters categories={categories ?? []} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><Wallet className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Nilai Ekonomi Terfasilitasi</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">Rp{totalValue.toLocaleString('id-ID')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><CheckCircle2 className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Pekerjaan Terselesaikan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{completedJobs}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><Store className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">UMKM Terdampak</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{affectedUmkm}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><ShieldCheck className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Rata-rata Trust Score</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{avgTrustScore}/100</p></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0"><Lightbulb className="h-4 w-4" /><CardTitle className="text-base">Insight & Rekomendasi</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{insight}</p></CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Detail Pekerjaan</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left font-medium">Judul</th>
                <th className="p-3 text-left font-medium">Kategori</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Prioritas</th>
                <th className="p-3 text-left font-medium">Waktu</th>
                <th className="p-3 text-left font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(!jobs || jobs.length === 0) && (
                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Gak ada data buat filter ini.</td></tr>
              )}
              {jobs?.map((job) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="p-3">{job.description.slice(0, 40)}</td>
                  <td className="p-3">{(job.categories as unknown as { name: string }[] | null)?.[0]?.name ?? '-'}</td>
                  <td className="p-3"><Badge variant="outline">{statusLabels[job.status] ?? job.status}</Badge></td>
                  <td className="p-3">{job.is_urgent ? <Badge variant="destructive">Urgent</Badge> : <span className="text-muted-foreground">Normal</span>}</td>
                  <td className="p-3 text-muted-foreground">{new Date(job.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="p-3">
                    <Link href={`/job/${job.id}`}><Button size="sm" variant="outline">Lihat Detail</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
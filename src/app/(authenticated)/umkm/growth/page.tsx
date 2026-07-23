import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateGrowthData } from '@/lib/ai/growth-insight'
import { generateGrowthNarrative } from '@/lib/ai/growth-narrative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Tag, TrendingUp, ArrowUp, ArrowDown, CheckCircle2, Circle } from 'lucide-react'

export default async function GrowthDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('business_name')
    .eq('user_id', user!.id)
    .single()

  const growthData = await calculateGrowthData(user!.id)
  const narrative = await generateGrowthNarrative(profile?.business_name ?? 'UMKM', growthData)

  const checklistItems = [
    { label: 'Deskripsi usaha diisi', done: growthData.profileCompleteness.hasDescription },
    { label: 'Kisaran harga dasar diisi', done: growthData.profileCompleteness.hasPriceRange },
    { label: 'Minimal 1 listing aktif', done: growthData.profileCompleteness.hasListing },
    { label: 'Identitas terverifikasi', done: growthData.profileCompleteness.hasVerification },
  ]

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Growth Dashboard</h1>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pendapatan Bulan Ini</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">Rp{growthData.currentMonthRevenue.toLocaleString('id-ID')}</p>
            <p className={`text-xs ${growthData.revenueChangePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {growthData.revenueChangePercent >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />} {Math.abs(growthData.revenueChangePercent)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pekerjaan Selesai</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{growthData.totalCompletedJobs}</p></CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" />Tren Pendapatan</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{narrative.revenueInsight}</p></CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" />Perbandingan Harga</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm">{narrative.priceInsight}</p>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Harga kamu: Rp{growthData.avgPriceThisUmkm.toLocaleString('id-ID')}</span>
            <span>Rata-rata sekategori: Rp{growthData.avgPriceRegion.toLocaleString('id-ID')}</span>
          </div>
        </CardContent>
      </Card>

      {growthData.busiestCategory && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Kategori Paling Laku</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{growthData.busiestCategory}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />Checklist Kelengkapan Profil ({growthData.profileCompleteness.percent}%)</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">{narrative.profileInsight}</p>
          <ul className="space-y-2">
            {checklistItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span>{item.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}</span>
                <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
          {!growthData.profileCompleteness.hasListing && (
            <Link href="/umkm/catalog/new"><Button size="sm" className="mt-3">+ Tambah Listing</Button></Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
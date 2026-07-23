import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateGrowthData } from '@/lib/ai/growth-insight'
import { generateGrowthNarrative } from '@/lib/ai/growth-narrative'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, Wallet, ArrowUp, ArrowDown, CheckCircle2, Circle, TrendingUp } from 'lucide-react'

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

  const maxRevenue = Math.max(growthData.previousMonthRevenue, growthData.currentMonthRevenue, 1)
  const maxPrice = Math.max(growthData.avgPriceThisUmkm, growthData.avgPriceRegion, 1)

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="animate-fade-in-up mb-6 text-2xl font-bold">Growth Dashboard</h1>

      {/* Quick stats */}
      <div className="animate-fade-in-up mb-4 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pendapatan Bulan Ini</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">Rp{growthData.currentMonthRevenue.toLocaleString('id-ID')}</p>
            <p className={`text-xs ${growthData.revenueChangePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
              {growthData.revenueChangePercent >= 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />} {Math.abs(growthData.revenueChangePercent)}% dari bulan lalu
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pekerjaan Selesai</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{growthData.totalCompletedJobs}</p></CardContent>
        </Card>
      </div>

      {/* AI Insight — spotlight, paling menonjol di halaman */}
      <Card className="animate-fade-in-up mb-6 border-accent-brand/30 bg-accent-brand/5 ring-1 ring-accent-brand/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-brand">
              <Sparkles className="h-4 w-4 text-accent-brand-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Insight AI</CardTitle>
              <p className="text-xs text-muted-foreground">Dianalisis otomatis dari performa usaha kamu</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <p className="rounded-lg bg-background/60 p-3 text-sm">{narrative.revenueInsight}</p>
          <p className="rounded-lg bg-background/60 p-3 text-sm">{narrative.priceInsight}</p>
          <p className="rounded-lg bg-background/60 p-3 text-sm">{narrative.profileInsight}</p>
        </CardContent>
      </Card>

      {/* Grafik tren pendapatan */}
      <Card className="animate-fade-in-up mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" />Tren Pendapatan</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Bulan Lalu</span>
              <span>Rp{growthData.previousMonthRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${(growthData.previousMonthRevenue / maxRevenue) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">Bulan Ini</span>
              <span className="font-medium">Rp{growthData.currentMonthRevenue.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${(growthData.currentMonthRevenue / maxRevenue) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Perbandingan harga */}
      <Card className="animate-fade-in-up mb-4">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Perbandingan Harga</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-2">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">Harga Kamu</span>
              <span className="font-medium">Rp{growthData.avgPriceThisUmkm.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${(growthData.avgPriceThisUmkm / maxPrice) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Rata-rata Sekategori</span>
              <span>Rp{growthData.avgPriceRegion.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${(growthData.avgPriceRegion / maxPrice) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {growthData.busiestCategory && (
        <Card className="animate-fade-in-up mb-4">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Kategori Paling Laku</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{growthData.busiestCategory}</p></CardContent>
        </Card>
      )}

      {/* Checklist kelengkapan profil */}
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4" />Kelengkapan Profil</CardTitle>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${growthData.profileCompleteness.percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{growthData.profileCompleteness.percent}% lengkap</p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {checklistItems.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span>{item.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}</span>
                <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
          {!growthData.profileCompleteness.hasListing && (
            <Link href="/umkm/catalog/new"><Button size="sm" className="mt-3 bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90">+ Tambah Listing</Button></Link>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { signOut } from '@/lib/actions/auth'
import { calculateTrustScore } from '@/lib/trust-score'
import { applicationStatusLabel } from '@/lib/status-labels'
import {
  LineChart, LogOut, Package, ClipboardList, ExternalLink, ArrowRight, Info,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

function ringColor(score: number) {
  if (score >= 75) return 'stroke-success'
  if (score >= 40) return 'stroke-rating'
  return 'stroke-destructive'
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Baik'
  if (score >= 40) return 'Cukup'
  return 'Perlu Ditingkatkan'
}

export default async function UmkmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('business_name')
    .eq('user_id', user!.id)
    .single()

  const scoreResult = await calculateTrustScore(user!.id)
  const trustScore = scoreResult.total

  const { data: listings } = await supabase
    .from('listings')
    .select('id, status')
    .eq('umkm_id', user!.id)

  const totalListings = listings?.length ?? 0

  const { data: recentApplications } = await supabase
    .from('job_applications')
    .select('id, status, created_at, job_postings(description)')
    .eq('umkm_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (trustScore / 100) * circumference

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="animate-fade-in-up mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard — {profile?.business_name}</h1>
          <p className="text-sm text-muted-foreground">Selamat datang kembali, kelola bisnis kamu di sini</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/umkm/${user!.id}`}>
            <Button variant="outline" size="sm"><ExternalLink className="mr-1.5 h-4 w-4" />Lihat Profil Publik</Button>
          </Link>
          <Link href="/umkm/growth">
            <Button size="sm" className="bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90">
              <LineChart className="mr-1.5 h-4 w-4" />Growth Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:grid-cols-3">
        {/* Trust Score ring */}
        <Card className="animate-fade-in-up relative">
          <Dialog>
            <DialogTrigger render={
              <button className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />
            }>
              <Info className="h-4 w-4" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bagaimana Trust Score Dihitung?</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Trust Score adalah skor komposit dari 100 poin yang mencerminkan reputasi usaha kamu di platform, dihitung otomatis dari 4 komponen:
                </p>
                <ul className="space-y-2">
                  <li className="flex justify-between rounded-md bg-muted/30 p-2">
                    <span>Rating rata-rata dari pelanggan</span>
                    <span className="font-medium">50 poin</span>
                  </li>
                  <li className="flex justify-between rounded-md bg-muted/30 p-2">
                    <span>Jumlah pekerjaan selesai</span>
                    <span className="font-medium">20 poin</span>
                  </li>
                  <li className="flex justify-between rounded-md bg-muted/30 p-2">
                    <span>Pelanggan yang order berulang</span>
                    <span className="font-medium">15 poin</span>
                  </li>
                  <li className="flex justify-between rounded-md bg-muted/30 p-2">
                    <span>Verifikasi identitas (KTP)</span>
                    <span className="font-medium">15 poin</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Tips: selesaikan lebih banyak pekerjaan, jaga kualitas layanan agar rating tinggi, dan lengkapi verifikasi identitas untuk menaikkan skor kamu.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <CardContent className="flex flex-col items-center pt-6">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-muted" />
                <circle
                  cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeLinecap="round"
                  className={`transition-all ${ringColor(trustScore)}`}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{trustScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">{scoreLabel(trustScore)}</p>

            <div className="mt-4 w-full space-y-3">
              {[
                { label: 'Rating', value: scoreResult.breakdown.rating, max: 50 },
                { label: 'Penyelesaian Job', value: scoreResult.breakdown.completion, max: 20 },
                { label: 'Pelanggan Setia', value: scoreResult.breakdown.repeatCustomer, max: 15 },
                { label: 'Verifikasi', value: scoreResult.breakdown.verification, max: 15 },
              ].map((item) => {
                const percent = Math.round((item.value / item.max) * 100)
                const barColor = percent >= 75 ? 'bg-success' : percent >= 40 ? 'bg-rating' : 'bg-destructive'
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{item.label}</span>
                      <span className="font-medium text-foreground">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <Link href="/umkm/trust-score" className="mt-4 w-full">
              <Button variant="outline" size="sm" className="w-full">Lihat Detail Skor</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Katalog */}
        <Card className="animate-fade-in-up flex h-full flex-col">
          <CardContent className="flex flex-1 flex-col pt-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background">
                <Package className="h-4 w-4" />
              </div>
              <h2 className="font-semibold">Kelola Katalog</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">Kelola produk, harga, dan ketersediaan katalog kamu.</p>

            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="w-full rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-3xl font-bold">{totalListings}</p>
                <p className="text-xs text-muted-foreground">Total Produk</p>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/umkm/catalog">
                <Button className="w-full bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90">Kelola Katalog</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Promo card */}
         <Card className="animate-fade-in-up flex h-full flex-col border-accent-brand/30 bg-accent-brand/5">
          <CardContent className="flex flex-1 flex-col pt-6 text-center">
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-brand">
                <LineChart className="h-6 w-6 text-accent-brand-foreground" />
              </div>
              <h2 className="font-semibold">Tingkatkan Performa Bisnis</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pantau insight AI, tren pendapatan, dan rekomendasi tindak lanjut buat kembangkan usaha kamu.
              </p>
            </div>
            <div className="mt-4">
              <Link href="/umkm/growth">
                <Button className="w-full bg-accent-brand text-accent-brand-foreground hover:bg-accent-brand/90">
                  Growth Dashboard<ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incoming requests table */}
      <Card className="animate-fade-in-up mt-4">
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <h2 className="font-semibold">Permintaan Masuk</h2>
            </div>
            <Link href="/umkm/requests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {(!recentApplications || recentApplications.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Belum ada permintaan masuk.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Deskripsi</th>
                    <th className="pb-2 font-medium">Tanggal</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentApplications.map((app) => {
                    const job = Array.isArray(app.job_postings) ? app.job_postings[0] : app.job_postings
                    return (
                      <tr key={app.id}>
                        <td className="max-w-xs truncate py-3">{job?.description ?? '-'}</td>
                        <td className="py-3 text-muted-foreground">{new Date(app.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            app.status === 'accepted' ? 'bg-success/10 text-success' :
                            app.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {applicationStatusLabel(app.status)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="animate-fade-in-up mt-4 flex flex-wrap gap-3">
        <Link href="/profile"><Button variant="outline" size="sm">Edit Profil</Button></Link>
        <Link href="/transactions"><Button variant="outline" size="sm">Riwayat Transaksi</Button></Link>
        <form action={signOut}><Button variant="outline" size="sm"><LogOut className="mr-1.5 h-4 w-4" />Logout</Button></form>
      </div>
    </div>
  )
}
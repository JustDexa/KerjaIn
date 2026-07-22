import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { jobStatusLabel, transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'
import { Briefcase, Sparkles, Search as SearchIcon, MessageSquareText, ArrowRight } from 'lucide-react'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  // /home ini khusus dashboard role 'user' — umkm & admin punya dashboard sendiri
  if (profile?.role === 'umkm') redirect('/umkm/dashboard')
  if (profile?.role === 'admin') redirect('/admin')

  const [{ data: jobs }, { data: transactions }] = await Promise.all([
    supabase
      .from('job_postings')
      .select('id, description, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('transactions')
      .select('id, total_amount, status, payment_status, created_at, umkm_profiles(business_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const quickActions = [
    { label: 'Buat Permintaan', href: '/job/new', icon: Briefcase },
    { label: 'Tanya AI', href: '/ai-chat', icon: Sparkles },
    { label: 'Cari Layanan', href: '/search', icon: SearchIcon },
    { label: 'Chat Saya', href: '/chat', icon: MessageSquareText },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'kamu'}
        </h1>
        <p className="text-muted-foreground">Ada yang bisa kami bantu hari ini?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.href} href={action.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="size-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Postingan Saya</h2>
            <Link href="/my-jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Lihat semua <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {(!jobs || jobs.length === 0) && <p className="text-sm text-muted-foreground">Belum ada postingan.</p>}
          <div className="space-y-2">
            {jobs?.map((job) => (
              <Link key={job.id} href={`/job/${job.id}`}>
                <Card className="hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium">{job.description.slice(0, 50)}</CardTitle>
                    <Badge variant="outline">{jobStatusLabel(job.status)}</Badge>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transaksi Terbaru</h2>
            <Link href="/transactions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              Lihat semua <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {(!transactions || transactions.length === 0) && <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>}
          <div className="space-y-2">
            {transactions?.map((t) => {
  const umkmProfile = Array.isArray(t.umkm_profiles) ? t.umkm_profiles[0] : t.umkm_profiles
  return (
    <Link key={t.id} href={`/transactions/${t.id}`}>
      <Card className="hover:bg-muted/50">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{umkmProfile?.business_name ?? 'Transaksi'}</CardTitle>
            <Badge variant={t.status === 'completed' ? 'default' : 'secondary'}>
              {transactionStatusLabel(t.status)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Rp{Number(t.total_amount ?? 0).toLocaleString('id-ID')} · {paymentStatusLabel(t.payment_status)}
          </p>
        </CardHeader>
      </Card>
    </Link>
  )
})}
          </div>
        </section>
      </div>
    </div>
  )
}
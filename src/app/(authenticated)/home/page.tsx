import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconTile } from '@/components/shared/icon-tile'
import { RevealOnScroll } from '@/components/shared/reveal-on-scroll'
import { jobStatusLabel, transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'
import {
  Briefcase, Sparkles, Search as SearchIcon, MessageSquareText,
  ArrowRight, FileText, Wallet, ChevronRight,
} from 'lucide-react'

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
    { label: 'Buat Permintaan', description: 'Posting kebutuhan kamu', href: '/job/new', icon: Briefcase, featured: false },
    { label: 'Tanya AI', description: 'Rekomendasi UMKM instan', href: '/ai-chat', icon: Sparkles, featured: true },
    { label: 'Cari Layanan', description: 'Jelajahi katalog UMKM', href: '/search', icon: SearchIcon, featured: false },
    { label: 'Chat Saya', description: 'Lanjutkan percakapan', href: '/chat', icon: MessageSquareText, featured: false },
  ]
  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold sm:text-3xl">
          {greeting()}, {profile?.full_name?.split(' ')[0] ?? 'kamu'}
        </h1>
        <p className="mt-1 text-muted-foreground">Ada yang bisa kami bantu hari ini?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action, index) => (
          <RevealOnScroll key={action.href} delay={index * 75}>
            <Link href={action.href}>
              <Card
                className={`group relative h-full transition-all hover:-translate-y-1 hover:shadow-md ${
                  action.featured ? 'ring-1 ring-accent-brand/40' : ''
                }`}
              >
                {action.featured && (
                  <span className="absolute right-2 top-2 rounded-full bg-accent-brand px-2 py-0.5 text-[10px] font-medium text-accent-brand-foreground">
                    Unggulan
                  </span>
                )}
                <CardContent className="flex flex-col items-center justify-center gap-2 p-5 text-center">
                  <IconTile icon={action.icon} className="transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </CardContent>
              </Card>
            </Link>
          </RevealOnScroll>
        ))}
      </div>

      {/* Postingan & Transaksi */}
      <div className="grid gap-6 md:grid-cols-2">
        <RevealOnScroll>
          <Card className="h-full">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <IconTile icon={FileText} size="sm" />
                <h2 className="text-base font-semibold">Postingan Saya</h2>
              </div>
              <Link href="/my-jobs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Semua <ArrowRight className="size-3" />
              </Link>
            </div>

            {(!jobs || jobs.length === 0) ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Belum ada postingan.</p>
                <Link href="/job/new" className="mt-2 inline-block text-xs font-medium underline underline-offset-4">
                  Buat permintaan pertama kamu
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/job/${job.id}`}>
                    <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{job.description}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline">{jobStatusLabel(job.status)}</Badge>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <Card className="h-full">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <IconTile icon={Wallet} size="sm" />
                <h2 className="text-base font-semibold">Transaksi Terbaru</h2>
              </div>
              <Link href="/transactions" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                Semua <ArrowRight className="size-3" />
              </Link>
            </div>

            {(!transactions || transactions.length === 0) ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
                <Link href="/search" className="mt-2 inline-block text-xs font-medium underline underline-offset-4">
                  Mulai cari layanan
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {transactions.map((t) => {
                  const umkmProfile = Array.isArray(t.umkm_profiles) ? t.umkm_profiles[0] : t.umkm_profiles
                  return (
                    <Link key={t.id} href={`/transactions/${t.id}`}>
                      <div className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{umkmProfile?.business_name ?? 'Transaksi'}</p>
                          <p className="text-xs text-muted-foreground">
                            Rp{Number(t.total_amount ?? 0).toLocaleString('id-ID')} · {paymentStatusLabel(t.payment_status)}
                          </p>
                        </div>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="shrink-0">
                          {transactionStatusLabel(t.status)}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </RevealOnScroll>
      </div>
    </div>
  )
}
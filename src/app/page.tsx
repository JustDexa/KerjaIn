import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Search, MapPin, ShieldCheck, ListChecks, Lock, Handshake,
  Wrench, Car, UtensilsCrossed, PartyPopper, Package,
  MessageSquareText, Sparkles, ClipboardCheck, ArrowRight,
} from 'lucide-react'

const categoryIcons: Record<string, typeof Wrench> = {
  'Home Service': Wrench,
  'Otomotif': Car,
  'Food and Catering': UtensilsCrossed,
  'Tempat Sewa / Event Organizer': PartyPopper,
}

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)

  const { data: featuredUmkm } = await supabase
    .from('umkm_profiles')
    .select('user_id, business_name, service_area, trust_score, description')
    .order('trust_score', { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold">KerjaIn</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium">Masuk</Link>
            <Link href="/register"><Button size="sm">Daftar</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="secondary" className="mb-4">Solo Raya · SDG 8 Decent Work</Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Temukan UMKM & Pekerja Lepas Terpercaya
            </h1>
            <p className="mt-4 text-muted-foreground">
              KerjaIn menghubungkan kamu dengan UMKM dan pekerja lepas terverifikasi di Solo Raya —
              didukung skor reputasi yang transparan dan rekomendasi AI yang bisa dijelaskan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/search"><Button size="lg">Cari Layanan</Button></Link>
              <Link href="/register"><Button size="lg" variant="outline">Daftarkan Usaha Anda</Button></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-8">
              <div>
                <p className="text-2xl font-bold">{categories?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground">Kategori Aktif</p>
              </div>
              <div>
                <p className="text-2xl font-bold">Transparan</p>
                <p className="text-sm text-muted-foreground">Trust Score Terverifikasi</p>
              </div>
              <div>
                <p className="text-2xl font-bold">Explainable</p>
                <p className="text-sm text-muted-foreground">Rekomendasi AI</p>
              </div>
            </div>
          </div>

          <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted/30">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border bg-background">
                <Handshake className="h-7 w-7" />
              </div>
              <p className="text-sm">Ilustrasi Hero</p>
            </div>
          </div>
        </div>

        {/* Floating search bar */}
        <form action="/search" method="get" className="mt-8 flex flex-col gap-2 rounded-xl border bg-card p-2 shadow-sm md:flex-row">
          <div className="flex flex-1 items-center gap-2 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input 
              name="q" 
              placeholder="Jasa atau barang apa yang kamu cari?" 
              className="border-0 shadow-none focus-visible:ring-0" 
            />
          </div>
          <div className="flex items-center gap-2 border-t px-3 pt-2 md:border-l md:border-t-0 md:pt-0">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input 
              name="location" 
              placeholder="Lokasi" 
              className="border-0 shadow-none focus-visible:ring-0 md:w-40" 
            />
          </div>
          <Button type="submit" className="w-full md:w-auto md:shrink-0">Cari</Button>
        </form>
      </section>

      {/* Browse by category */}
      <section id="categories" className="border-t bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-2xl font-bold">Jelajahi Kategori</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(categories ?? []).map((cat) => {
              const Icon = categoryIcons[cat.name] ?? Package
              return (
                <Link key={cat.id} href={`/search?category=${cat.id}`}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">{cat.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured UMKM */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-2xl font-bold">UMKM Pilihan</h2>

          {(!featuredUmkm || featuredUmkm.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Belum ada UMKM terdaftar — jadilah yang pertama.{' '}
                <Link href="/register" className="underline">Daftarkan usaha kamu</Link>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredUmkm?.map((u) => (
              <Link key={u.user_id} href={`/umkm/${u.user_id}`}>
                <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="pt-6">
                    <p className="font-medium">{u.business_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{u.service_area}
                    </p>
                    <Badge variant="secondary" className="mt-3">Trust Score {u.trust_score ?? 0}/100</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why KerjaIn */}
      <section className="border-t bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-2xl font-bold">Kenapa KerjaIn</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-medium">Trust Score Terverifikasi</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Reputasi UMKM dibangun otomatis dari histori transaksi nyata, bukan klaim sepihak.
              </p>
            </div>
            <div>
              <ListChecks className="mb-3 h-6 w-6" />
              <h3 className="font-medium">Rekomendasi AI yang Transparan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Setiap rekomendasi disertai alasan eksplisit — bukan kotak hitam.
              </p>
            </div>
            <div>
              <Lock className="mb-3 h-6 w-6" />
              <h3 className="font-medium">Transaksi Aman</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat, deal, dan pembayaran tercatat rapi dalam satu alur yang jelas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Matching */}
      <section id="how-it-works" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div className="order-2 flex aspect-square items-center justify-center rounded-xl border bg-muted/30 md:order-1">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border bg-background">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-sm">Ilustrasi Matching</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="mb-4 text-2xl font-bold">Cari Lewat AI Assistant</h2>
            <ol className="space-y-4">
              {[
                { icon: MessageSquareText, text: 'Ceritakan kebutuhan kamu dengan bahasa natural' },
                { icon: Sparkles, text: 'AI mencari & merekomendasikan UMKM yang cocok' },
                { icon: ClipboardCheck, text: 'Tinjau rekomendasi beserta alasannya' },
                { icon: Handshake, text: 'Chat langsung dan lanjut ke kesepakatan' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className="pt-1 text-sm">{step.text}</span>
                </li>
              ))}
            </ol>
            <Link href="/ai-chat">
              <Button className="mt-6">
                Coba AI Matching<ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <span className="text-lg font-bold">KerjaIn</span>
              <p className="mt-2 text-sm text-muted-foreground">
                Professional Reputation Network untuk UMKM & pekerja lepas Solo Raya.
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Platform</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#how-it-works">Cara Kerja</a></li>
                <li><a href="#categories">Kategori</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Untuk UMKM</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/register">Daftarkan Usaha</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Perusahaan</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Tim Clairvoyant — BYTESFEST2026</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-sm text-muted-foreground">
            © 2026 KerjaIn. Dibuat untuk BYTESFEST2026.
          </div>
        </div>
      </footer>
    </div>
  )
}
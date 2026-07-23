import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { IconTile } from '@/components/shared/icon-tile'
import { IllustrationPlaceholder } from '@/components/shared/illustration-placeholder'
import { LandingHeader } from '@/components/shared/landing-header'
import { LandingFooter } from '@/components/shared/landing-footer'
import { categoryIcons, categoryDescriptions, whyKerjaIn, matchingSteps } from '@/lib/landing-content'
import { Search, MapPin, Package, ShieldCheck, ArrowRight, Star } from 'lucide-react'
import { RevealOnScroll } from '@/components/shared/reveal-on-scroll'

type UserRelation = { avatar_url: string | null }
function normalizeUserRelation(u: UserRelation | UserRelation[] | null | undefined): UserRelation | null {
  if (!u) return null
  return Array.isArray(u) ? (u[0] ?? null) : u
}

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)

  const { data: categoryUmkmLinks } = await supabase
    .from('umkm_categories')
    .select('category_id')

  const umkmCountByCategory = new Map<string, number>()
  categoryUmkmLinks?.forEach((row) => {
    umkmCountByCategory.set(row.category_id, (umkmCountByCategory.get(row.category_id) ?? 0) + 1)
  })

  const { data: featuredUmkm } = await supabase
    .from('umkm_profiles')
    .select('user_id, business_name, service_area, trust_score, description, banner_url, users(avatar_url)')
    .order('trust_score', { ascending: false })
    .limit(4)

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

{/* Hero */}
      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 py-16 md:py-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--accent-brand) 0%, transparent 70%)' }}
        />
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

          <div className="relative animate-fade-in-up-delay-1">
            <IllustrationPlaceholder
              icon={ShieldCheck}
              label="Ilustrasi Hero"
              imageSrc="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&q=80"
              imageAlt="Pemilik usaha kecil sedang bekerja"
            />
            <Card className="absolute -bottom-4 -left-4 hidden w-48 sm:block">
              <CardContent className="flex items-center gap-2 p-3">
                <IconTile icon={ShieldCheck} size="sm" />
                <div>
                  <p className="text-xs text-muted-foreground">Trust Score</p>
                  <p className="text-sm font-bold">92/100</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating search bar */}
<form action="/search" method="get" className="mt-8 flex animate-fade-in-up-delay-2 flex-col gap-2 rounded-xl bg-card p-2 ring-1 ring-foreground/10 md:flex-row">          <div className="flex flex-1 items-center gap-2 px-3">
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
          <h2 className="mb-1 text-2xl font-bold">Jelajahi Kategori</h2>
          <p className="mb-8 text-sm text-muted-foreground">Temukan UMKM dan pekerja lepas sesuai kebutuhan kamu</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(categories ?? []).map((cat, index) => {
              const Icon = categoryIcons[cat.name] ?? Package
              const umkmCount = umkmCountByCategory.get(cat.id) ?? 0
              return (
                <RevealOnScroll key={cat.id} delay={index * 75}>
                  <Link href={`/search?category=${cat.id}`}>
                    <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
                        <IconTile icon={Icon} />
                        <p className="text-sm font-medium">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{categoryDescriptions[cat.name] ?? ''}</p>
                        <Badge variant="outline" className="mt-1">{umkmCount} UMKM tersedia</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured UMKM */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-1 text-2xl font-bold">UMKM Pilihan</h2>
          <p className="mb-8 text-sm text-muted-foreground">Diurutkan berdasarkan Trust Score tertinggi</p>

          {(!featuredUmkm || featuredUmkm.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <IconTile icon={Package} />
                <p className="text-sm text-muted-foreground">
                  Belum ada UMKM terdaftar — jadilah yang pertama.{' '}
                  <Link href="/register" className="underline">Daftarkan usaha kamu</Link>
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredUmkm?.map((u, index) => {
              const avatar = normalizeUserRelation(u.users as UserRelation | UserRelation[] | null)
              const starCount = Math.round((u.trust_score ?? 0) / 20)
              return (
                <RevealOnScroll key={u.user_id} delay={index * 75}>
                <Link href={`/umkm/${u.user_id}`}>
                  <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                    {u.banner_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.banner_url} alt="" className="h-20 w-full object-cover" />
                    ) : (
                      <div className="h-20 w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
                    )}
                    <CardContent className="-mt-6 pt-0">
                      {avatar?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar.avatar_url} alt={u.business_name} className="h-12 w-12 shrink-0 rounded-full border-2 border-background object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-medium text-background">
                          {u.business_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <p className="mt-2 truncate font-medium">{u.business_name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />{u.service_area}
                      </p>
                      {u.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{u.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < starCount ? 'fill-rating text-rating' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">{u.trust_score ?? 0}/100</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                </RevealOnScroll>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why KerjaIn */}
      <section className="border-t bg-muted/20 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-2xl font-bold">Kenapa KerjaIn</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {whyKerjaIn.map((item) => (
              <div key={item.title}>
                <IconTile icon={item.icon} className="mb-4" />
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Matching */}
      <section id="how-it-works" className="py-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <IllustrationPlaceholder
            icon={Package}
            label="Ilustrasi Matching"
            className="order-2 md:order-1"
            imageSrc="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
            imageAlt="Pekerja lepas bekerja di ruang kerjanya"
          />
          <div className="order-1 md:order-2">
            <h2 className="mb-4 text-2xl font-bold">Cari Lewat AI Assistant</h2>
            <ol className="space-y-4">
              {matchingSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <IconTile icon={step.icon} size="sm" />
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

      <LandingFooter />
    </div>
  )
}
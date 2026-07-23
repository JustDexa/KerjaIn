import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { StartChatButton } from '@/components/shared/start-chat-button'
import { Star, Store, MapPin, PackageOpen, ImageOff } from 'lucide-react'
import { getDefaultBannerClass } from '@/lib/banner-gradient'

function trustScoreBadgeClass(score: number) {
  if (score >= 75) return 'bg-success text-success-foreground'
  if (score >= 40) return 'bg-rating text-foreground'
  return 'bg-destructive text-white'
}

export default async function UmkmPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('*, users(full_name, avatar_url)')
    .eq('user_id', id)
    .single()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  let currentUserRole: string | null = null
  if (currentUser) {
    const { data: currentUserData } = await supabase.from('users').select('role').eq('id', currentUser.id).single()
    currentUserRole = currentUserData?.role ?? null
  }
  const isOwnProfile = currentUser?.id === id

  if (!profile) notFound()

  const { data: categoryLinks } = await supabase
    .from('umkm_categories')
    .select('categories(name)')
    .eq('umkm_id', id)

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('umkm_id', id)
    .eq('status', 'active')

  const { data: portfolioEntries } = await supabase
    .from('portfolio_entries')
    .select('*, reviews(rating, users(full_name, avatar_url)), transactions(job_postings(description), listings(title))')
    .eq('umkm_id', id)
    .order('date', { ascending: false })

  const trustScore = Math.round(profile.trust_score ?? 0)

  return (
    <div className="mx-auto max-w-2xl">
      {/* Banner */}
      <div className={`relative h-40 w-full overflow-hidden md:h-52 ${
        !profile.banner_url ? `bg-gradient-to-br ${getDefaultBannerClass(profile.business_name)}` : ''
      }`}>
        {profile.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.banner_url} alt="Banner" className="h-full w-full object-cover" />
        ) : (
          <Store className="absolute -bottom-4 -right-4 h-32 w-32 text-black/5" />
        )}
      </div>

      <div className="relative z-10 px-6">
        {/* Avatar overlap */}
        <div className="animate-fade-in-up -mt-10 flex items-end justify-between">
          {profile.users?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.users.avatar_url}
              alt={profile.business_name ?? ''}
              className="relative z-10 h-20 w-20 rounded-full border-4 border-background object-cover"
            />
          ) : (
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-foreground text-2xl font-semibold text-background">
              {profile.business_name?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="animate-fade-in-up mt-3 mb-6">
          <h1 className="text-2xl font-bold">{profile.business_name}</h1>
          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />{profile.service_area}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryLinks
              ?.filter((c: { categories: { name: string }[] | null }) => c.categories?.[0]?.name)
              .map((c: { categories: { name: string }[] | null }, i: number) => (
                <Badge key={i} variant="secondary">{c.categories?.[0]?.name}</Badge>
              ))}
          </div>
        </div>

        {currentUserRole === 'user' && !isOwnProfile && (
          <div className="animate-fade-in-up mb-4">
            <StartChatButton umkmId={id} />
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="mb-1.5 text-sm text-muted-foreground">Trust Score</p>
              <div className={`inline-block rounded-lg px-4 py-2 text-lg font-bold ${trustScoreBadgeClass(trustScore)}`}>
                {trustScore}/100
              </div>
            </div>
            {trustScore === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada transaksi selesai</p>
            )}
          </CardContent>
        </Card>

        {profile.description && (
          <div className="animate-fade-in-up mb-6 border-l-2 border-accent-brand/40 pl-4">
            <p className="text-sm italic text-muted-foreground">&ldquo;{profile.description}&rdquo;</p>
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold">Katalog</h2>
        <div className="grid grid-cols-2 gap-4">
          {(!listings || listings.length === 0) && (
            <div className="col-span-2 flex flex-col items-center gap-2 rounded-lg border border-dashed py-8">
              <PackageOpen className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada listing aktif.</p>
            </div>
          )}
          {listings?.map((l, index) => (
            <Card
              key={l.id}
              className="animate-fade-in-up gap-0 overflow-hidden pt-0 opacity-0 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
            >
              {l.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.photos[0]} alt={l.title} className="aspect-square w-full object-cover" />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-muted/50">
                  <ImageOff className="h-6 w-6 text-muted-foreground/50" />
                </div>
              )}
<CardHeader className="px-3 pb-0 pt-3"><CardTitle className="text-sm">{l.title}</CardTitle></CardHeader>              <CardContent className="p-3 pt-0">
                <p className="line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
                {l.price && (
                  <p className="mt-2 text-md font-semibold text-accent-brand">
                    Rp{Number(l.price).toLocaleString('id-ID')} {l.price_unit}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="mb-3 mt-8 text-lg font-semibold">Portofolio</h2>
        <div className="space-y-3">
          {(!portfolioEntries || portfolioEntries.length === 0) && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8">
              <Star className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada entri portofolio.</p>
            </div>
          )}
          {portfolioEntries?.map((entry, index) => (
            <Card
              key={entry.id}
              className="animate-fade-in-up opacity-0 transition-all hover:shadow-md"
              style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'forwards' }}
            >
              <CardContent className="pt-4">
                {entry.reviews?.users?.full_name && (
                  <div className="mb-3 flex items-center gap-2">
                    {entry.reviews.users.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.reviews.users.avatar_url} alt={entry.reviews.users.full_name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                        {entry.reviews.users.full_name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium leading-none">{entry.reviews.users.full_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                )}

                {entry.photos?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.photos[0]} alt="Foto pekerjaan" className="mb-3 h-40 w-auto max-w-full rounded-md object-contain" />
                )}

                <div className="flex items-center justify-between">
                  {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                  {!entry.reviews?.users?.full_name && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('id-ID')}
                    </span>
                  )}
                </div>

                {entry.reviews?.rating && (
                  <div className="mt-2 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < entry.reviews.rating ? 'fill-rating text-rating' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                )}

                {(entry.transactions?.job_postings?.description || entry.transactions?.listings?.title) && (
                  <p className="mt-2 text-sm font-medium">
                    {entry.transactions?.job_postings?.description ?? entry.transactions?.listings?.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{entry.comment}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
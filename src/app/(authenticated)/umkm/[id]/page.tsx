import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { StartChatButton } from '@/components/shared/start-chat-button'
import { Star } from 'lucide-react'
import { getDefaultBannerClass } from '@/lib/banner-gradient'
import { Store } from 'lucide-react'

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
        <div className="-mt-10 flex items-end justify-between">
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

        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-bold">{profile.business_name}</h1>
          <p className="text-muted-foreground">{profile.service_area}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryLinks
              ?.filter((c: { categories: { name: string }[] | null }) => c.categories?.[0]?.name)
              .map((c: { categories: { name: string }[] | null }, i: number) => (
                <Badge key={i} variant="secondary">{c.categories?.[0]?.name}</Badge>
              ))}
          </div>
        </div>

        {currentUserRole === 'user' && !isOwnProfile && (
          <div className="mb-4">
            <StartChatButton umkmId={id} />
          </div>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trust Score</p>
<p className="text-3xl font-bold">{Math.round(profile.trust_score ?? 0)}/100</p>              </div>
              {(profile.trust_score ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground">Belum ada transaksi selesai</p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mb-6 text-sm">{profile.description}</p>

      <h2 className="mb-3 text-lg font-semibold">Katalog</h2>
      <div className="grid grid-cols-2 gap-4">
        {(!listings || listings.length === 0) && (
          <p className="col-span-2 text-sm text-muted-foreground">Belum ada listing aktif.</p>
        )}
        {listings?.map((l) => (
          <Card key={l.id} className="overflow-hidden">
            {l.photos?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photos[0]} alt={l.title} className="aspect-square w-full object-cover" />
            )}
            <CardHeader className="p-3"><CardTitle className="text-sm">{l.title}</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="line-clamp-2 text-xs text-muted-foreground">{l.description}</p>
              {l.price && (
                <p className="mt-2 text-sm font-medium">
                  Rp{Number(l.price).toLocaleString('id-ID')} {l.price_unit}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-lg font-semibold">Portofolio</h2>
      <div className="space-y-3">
        {(!portfolioEntries || portfolioEntries.length === 0) && (
          <p className="text-sm text-muted-foreground">Belum ada entri portofolio.</p>
        )}
        {portfolioEntries?.map((entry) => (
          <Card key={entry.id}>
      <CardContent className="pt-4">
        {entry.photos?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.photos[0]} alt="Foto pekerjaan" className="mb-3 h-40 w-auto max-w-full rounded-md object-contain" />
        )}
        <div className="flex items-center justify-between">
          {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
          <span className="text-xs text-muted-foreground">
            {new Date(entry.date).toLocaleDateString('id-ID')}
          </span>
        </div>
        {entry.reviews?.rating && (
          <div className="mt-2 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < entry.reviews.rating ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />
            ))}
          </div>
        )}
        {(entry.transactions?.job_postings?.description || entry.transactions?.listings?.title) && (
          <p className="mt-2 text-sm font-medium">
            {entry.transactions?.job_postings?.description ?? entry.transactions?.listings?.title}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{entry.comment}</p>
        {entry.reviews?.users?.full_name && (
          <div className="mt-2 flex items-center gap-1.5">
            {entry.reviews.users.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={entry.reviews.users.avatar_url} alt={entry.reviews.users.full_name} className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[8px] font-medium text-background">
                {entry.reviews.users.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{entry.reviews.users.full_name}</p>
          </div>
        )}
      </CardContent>
    </Card>
        ))}
</div>
      </div>
    </div>
  )
}
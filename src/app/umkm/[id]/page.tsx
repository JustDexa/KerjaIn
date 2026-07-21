import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'
import { StartChatButton } from '@/components/shared/start-chat-button'

export default async function UmkmPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('*, users(full_name)')
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
    .select('*')
    .eq('umkm_id', id)
    .order('date', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{profile.business_name}</h1>
        <p className="text-muted-foreground">{profile.service_area}</p>
        <div className="mt-2 flex flex-wrap gap-2">
        {categoryLinks?.map((c: { categories: { name: string }[] | null }, i: number) => (
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
              <p className="text-3xl font-bold">{profile.trust_score ?? 0}/100</p>
            </div>
            {(profile.trust_score ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada transaksi selesai</p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="mb-6 text-sm">{profile.description}</p>

      <h2 className="mb-3 text-lg font-semibold">Katalog</h2>
      <div className="space-y-3">
        {(!listings || listings.length === 0) && (
          <p className="text-sm text-muted-foreground">Belum ada listing aktif.</p>
        )}
        {listings?.map((l) => (
          <Card key={l.id}>
            <CardHeader><CardTitle className="text-base">{l.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{l.description}</p>
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
              <div className="flex items-center justify-between">
                {entry.category && <Badge variant="secondary">{entry.category}</Badge>}
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <p className="mt-2 text-sm">{entry.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
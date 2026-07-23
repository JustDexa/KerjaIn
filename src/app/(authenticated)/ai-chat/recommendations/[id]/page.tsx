import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { findMatchingUmkm } from '@/lib/ai/matching'
import { generateExplanations } from '@/lib/ai/explain'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreatePostingFromAiButton } from '@/components/shared/create-posting-from-ai-button'
import { Lightbulb, MapPin, ShieldCheck } from 'lucide-react'

export default async function AiRecommendationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) notFound()
  if (session.user_id !== user.id) notFound()

  const requirement = session.extracted_requirement as {
    category: string | null
    description: string | null
    location: string | null
    budget_min: number | null
    budget_max: number | null
    is_urgent: boolean
  }

  let candidates = session.candidates as (Awaited<ReturnType<typeof findMatchingUmkm>>[number] & { reason: string })[] | null

  // kalau belum pernah dihitung, hitung sekarang & simpan (biar gak dihitung ulang tiap refresh)
  if (!candidates) {
    const matched = await findMatchingUmkm(requirement)
    candidates = await generateExplanations(requirement, matched)

    await supabase
      .from('ai_recommendations')
      .update({ candidates })
      .eq('id', id)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="animate-fade-in-up">
        <h1 className="mb-1 text-2xl font-bold">Rekomendasi UMKM</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Berdasarkan: {requirement.description} · {requirement.location}
        </p>
      </div>

      {candidates.length === 0 && (
        <Card className="animate-fade-in-up border-dashed">
          <CardContent className="space-y-3 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada UMKM yang cocok sama kebutuhan kamu saat ini.
            </p>
            <CreatePostingFromAiButton requirement={requirement} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {candidates.map((c, index) => (
          <Card
            key={c.umkmId}
            className="animate-fade-in-up overflow-hidden opacity-0 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            {c.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.bannerUrl} alt="" className="h-20 w-full object-cover" />
            ) : (
              <div className="h-20 w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
            <CardHeader className="-mt-6 flex flex-row items-start justify-between pt-0">
              <div className="flex items-center gap-3">
                {c.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatarUrl} alt={c.businessName} className="h-12 w-12 shrink-0 rounded-full border-2 border-background object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-background bg-foreground text-sm font-medium text-background">
                    {c.businessName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <CardTitle className="text-base">{c.businessName}</CardTitle>
              </div>
              <Badge>Skor {c.score}/100</Badge>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />{c.serviceArea}
                <span className="mx-1">·</span>
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />Trust Score {c.trustScore}/100
              </p>
              {c.matchedListingTitle && (
                <p className="mt-1 text-sm">
                  {c.matchedListingTitle}{c.matchedPrice ? ` — Rp${c.matchedPrice.toLocaleString('id-ID')}` : ''}
                </p>
              )}
              <p className="mt-3 flex items-start gap-2 rounded-md bg-muted p-2 text-sm italic"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />{c.reason}</p>
              <Link href={`/umkm/${c.umkmId}`}>
                <Button size="sm" className="mt-3">Lihat Profil</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {candidates.length > 0 && (
        <div className="mt-6 text-center">
          <p className="mb-2 text-sm text-muted-foreground">Gak ada yang cocok?</p>
          <CreatePostingFromAiButton requirement={requirement} />
        </div>
      )}
    </div>
  )
}
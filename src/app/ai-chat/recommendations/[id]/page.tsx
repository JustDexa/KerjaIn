import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { findMatchingUmkm } from '@/lib/ai/matching'
import { generateExplanations } from '@/lib/ai/explain'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreatePostingFromAiButton } from '@/components/shared/create-posting-from-ai-button'

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
      <h1 className="mb-1 text-2xl font-bold">Rekomendasi UMKM</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Berdasarkan: {requirement.description} · {requirement.location}
      </p>

      {candidates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="space-y-3 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada UMKM yang cocok sama kebutuhan kamu saat ini.
            </p>
            <CreatePostingFromAiButton requirement={requirement} />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {candidates.map((c) => (
          <Card key={c.umkmId}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{c.businessName}</CardTitle>
              <Badge>Skor {c.score}/100</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">📍 {c.serviceArea} · Trust Score {c.trustScore}/100</p>
              {c.matchedListingTitle && (
                <p className="mt-1 text-sm">
                  {c.matchedListingTitle}{c.matchedPrice ? ` — Rp${c.matchedPrice.toLocaleString('id-ID')}` : ''}
                </p>
              )}
              <p className="mt-3 rounded-md bg-muted p-2 text-sm italic">💡 {c.reason}</p>
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
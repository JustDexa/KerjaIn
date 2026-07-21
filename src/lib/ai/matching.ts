import { createClient } from '@/lib/supabase/server'

type Requirement = {
  category: string | null
  description: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  is_urgent: boolean
}

export type MatchCandidate = {
  umkmId: string
  businessName: string
  serviceArea: string | null
  trustScore: number
  matchedListingTitle: string | null
  matchedPrice: number | null
  score: number
  scoreBreakdown: {
    categoryMatch: number
    trustScore: number
    priceMatch: number
    profileCompleteness: number
  }
}

export async function findMatchingUmkm(requirement: Requirement): Promise<MatchCandidate[]> {
  const supabase = await createClient()

  // ambil semua UMKM yang punya kategori matching (kalau kategori gak ketemu, ambil semua sebagai fallback longgar)
  let umkmIds: string[] | null = null

  if (requirement.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', `%${requirement.category}%`)
      .maybeSingle()

    if (category) {
      const { data: links } = await supabase
        .from('umkm_categories')
        .select('umkm_id')
        .eq('category_id', category.id)
      umkmIds = links?.map((l) => l.umkm_id) ?? []
    }
  }

  if (!umkmIds || umkmIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('umkm_profiles')
    .select('user_id, business_name, service_area, trust_score, description, base_price_range')
    .in('user_id', umkmIds)

  if (!profiles || profiles.length === 0) return []

  const { data: listings } = await supabase
    .from('listings')
    .select('umkm_id, title, price, description')
    .in('umkm_id', umkmIds)
    .eq('status', 'active')

  const candidates: MatchCandidate[] = profiles.map((profile) => {
    const umkmListings = listings?.filter((l) => l.umkm_id === profile.user_id) ?? []
    const bestListing = umkmListings[0] ?? null

    // 1. Category match — udah difilter di query, jadi selalu match = 30 poin
    const categoryMatch = 30

    // 2. Trust score — dinormalisasi ke skala 0-30
    const trustScoreContribution = ((profile.trust_score ?? 0) / 100) * 30

    // 3. Price match — 20 poin kalau ada listing dengan harga di range budget, 10 kalau ada listing tapi di luar range, 0 kalau gak ada listing sama sekali
    let priceMatch = 0
    if (bestListing?.price) {
      const price = Number(bestListing.price)
      const inRange =
        (!requirement.budget_min || price >= requirement.budget_min) &&
        (!requirement.budget_max || price <= requirement.budget_max)
      priceMatch = inRange ? 20 : 10
    }

    // 4. Profile completeness — 20 poin, kasih boost buat profil baru yang lengkap (anti-bias, sesuai PRD §13)
    let profileCompleteness = 0
    if (profile.description) profileCompleteness += 7
    if (profile.base_price_range) profileCompleteness += 7
    if (umkmListings.length > 0) profileCompleteness += 6

    const totalScore = Math.round(categoryMatch + trustScoreContribution + priceMatch + profileCompleteness)

    return {
      umkmId: profile.user_id,
      businessName: profile.business_name,
      serviceArea: profile.service_area,
      trustScore: profile.trust_score ?? 0,
      matchedListingTitle: bestListing?.title ?? null,
      matchedPrice: bestListing?.price ? Number(bestListing.price) : null,
      score: totalScore,
      scoreBreakdown: {
        categoryMatch,
        trustScore: Math.round(trustScoreContribution),
        priceMatch,
        profileCompleteness,
      },
    }
  })

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5)
}
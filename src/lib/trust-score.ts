import { createClient } from '@/lib/supabase/server'

// Formula komposit sederhana, total maksimal 100:
// - Rating rata-rata (0-5)         → bobot 50
// - Jumlah job selesai (cap di 20) → bobot 20
// - Repeat customer rate           → bobot 15
// - Verifikasi identitas           → bobot 15
export async function calculateTrustScore(umkmId: string) {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, user_id')
    .eq('umkm_id', umkmId)

  const { data: umkmUser } = await supabase
    .from('users')
    .select('is_verified')
    .eq('id', umkmId)
    .single()

  const totalReviews = reviews?.length ?? 0
  const avgRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0

  const uniqueCustomers = new Set(reviews?.map((r) => r.user_id)).size
  const repeatCustomers = totalReviews - uniqueCustomers
  const repeatRate = uniqueCustomers > 0 ? repeatCustomers / uniqueCustomers : 0

  const ratingScore = (avgRating / 5) * 50
  const completionScore = Math.min(totalReviews, 20) / 20 * 20
  const repeatScore = Math.min(repeatRate, 1) * 15
  const verificationScore = umkmUser?.is_verified ? 15 : 0

  const total = Math.round(ratingScore + completionScore + repeatScore + verificationScore)

  return {
    total: Math.min(total, 100),
    breakdown: {
      rating: Math.round(ratingScore),
      completion: Math.round(completionScore),
      repeatCustomer: Math.round(repeatScore),
      verification: verificationScore,
    },
    totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
  }
}
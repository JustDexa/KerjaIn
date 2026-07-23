import { createClient } from '@/lib/supabase/server'

export type GrowthData = {
  currentMonthRevenue: number
  previousMonthRevenue: number
  revenueChangePercent: number
  avgPriceThisUmkm: number
  avgPriceRegion: number
  busiestCategory: string | null
  profileCompleteness: {
    hasDescription: boolean
    hasPriceRange: boolean
    hasListing: boolean
    hasVerification: boolean
    percent: number
  }
  totalCompletedJobs: number
}

export async function calculateGrowthData(umkmId: string): Promise<GrowthData> {
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('total_amount, completed_at, status')
    .eq('umkm_id', umkmId)
    .eq('status', 'completed')

  const completed = transactions ?? []

  const currentMonthRevenue = completed
    .filter((t) => t.completed_at && t.completed_at >= startOfThisMonth)
    .reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0)

  const previousMonthRevenue = completed
    .filter((t) => t.completed_at && t.completed_at >= startOfLastMonth && t.completed_at < startOfThisMonth)
    .reduce((sum, t) => sum + Number(t.total_amount ?? 0), 0)

  const revenueChangePercent = previousMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
    : currentMonthRevenue > 0 ? 100 : 0

  const { data: myListings } = await supabase
    .from('listings')
    .select('price')
    .eq('umkm_id', umkmId)
    .eq('status', 'active')
    .not('price', 'is', null)

  const avgPriceThisUmkm = myListings && myListings.length > 0
    ? myListings.reduce((sum, l) => sum + Number(l.price), 0) / myListings.length
    : 0

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('service_area, description, base_price_range')
    .eq('user_id', umkmId)
    .single()

  const { data: myCategories } = await supabase
    .from('umkm_categories')
    .select('category_id')
    .eq('umkm_id', umkmId)

  const myCategoryIds = (myCategories ?? []).map((c) => c.category_id)

  let umkmIdsInSameCategory: string[] = []
  if (myCategoryIds.length > 0) {
    const { data: sameCategory } = await supabase
      .from('umkm_categories')
      .select('umkm_id')
      .in('category_id', myCategoryIds)
    umkmIdsInSameCategory = [...new Set((sameCategory ?? []).map((c) => c.umkm_id))]
  }

  const { data: regionListings } = await supabase
    .from('listings')
    .select('price, umkm_profiles!inner(service_area)')
    .eq('status', 'active')
    .eq('umkm_profiles.service_area', profile?.service_area ?? '')
    .in('umkm_id', umkmIdsInSameCategory.length > 0 ? umkmIdsInSameCategory : [umkmId])
    .not('price', 'is', null)

  const avgPriceRegion = regionListings && regionListings.length > 0
    ? regionListings.reduce((sum, l) => sum + Number(l.price), 0) / regionListings.length
    : 0

  const { data: categoryLinks } = await supabase
    .from('umkm_categories')
    .select('categories(name)')
    .eq('umkm_id', umkmId)

  const { data: portfolioEntries } = await supabase
    .from('portfolio_entries')
    .select('category')
    .eq('umkm_id', umkmId)

  const categoryCounts: Record<string, number> = {}
  portfolioEntries?.forEach((p) => {
    if (p.category) categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1
  })
  const busiestCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const { data: verification } = await supabase
    .from('verification_documents')
    .select('status')
    .eq('user_id', umkmId)
    .eq('status', 'verified')
    .maybeSingle()

  const { data: myActiveListings } = await supabase
    .from('listings')
    .select('id')
    .eq('umkm_id', umkmId)
    .eq('status', 'active')

  const profileCompleteness = {
    hasDescription: Boolean(profile?.description),
    hasPriceRange: Boolean(profile?.base_price_range),
    hasListing: (myActiveListings?.length ?? 0) > 0,
    hasVerification: Boolean(verification),
  }
  const completenessCount = Object.values(profileCompleteness).filter(Boolean).length

  return {
    currentMonthRevenue,
    previousMonthRevenue,
    revenueChangePercent,
    avgPriceThisUmkm: Math.round(avgPriceThisUmkm),
    avgPriceRegion: Math.round(avgPriceRegion),
    busiestCategory,
    profileCompleteness: { ...profileCompleteness, percent: Math.round((completenessCount / 4) * 100) },
    totalCompletedJobs: completed.length,
  }
}
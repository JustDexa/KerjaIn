import { createClient } from '@/lib/supabase/server'
import { SearchPageClient } from '@/components/shared/search-page-client'   

type SearchParams = {
  q?: string
  category?: string
  location?: string
  minRating?: string
}

// 1. Define the shape of the nested Supabase join
type JoinedCategory = {
  categories: 
    | { id: string; name: string } 
    | { id: string; name: string }[] 
    | null
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, category, location, minRating } = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)

  let query = supabase
    .from('umkm_profiles')
    .select('user_id, business_name, description, service_area, base_price_range, trust_score, is_online, umkm_categories(categories(id, name))')
    .order('trust_score', { ascending: false })

  if (location) query = query.ilike('service_area', `%${location}%`)
  if (minRating) query = query.gte('trust_score', Number(minRating))
  if (q) query = query.or(`business_name.ilike.%${q}%,description.ilike.%${q}%`)

  const { data: rawResults } = await query

  const results = category
    ? rawResults?.filter((u) =>
        // 2. Replace 'any' with your new type
        u.umkm_categories?.some((uc: JoinedCategory) => {
          const cat = Array.isArray(uc.categories) ? uc.categories[0] : uc.categories
          return cat?.id === category
        })
      )
    : rawResults

  return (
    <SearchPageClient
      categories={categories ?? []}
      results={results ?? []}
      initialFilters={{ q: q ?? '', category: category ?? '', location: location ?? '', minRating: minRating ?? '' }}
    />
  )
}
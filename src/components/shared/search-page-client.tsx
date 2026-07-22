'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { MapPin, LayoutGrid, List, Search as SearchIcon, Star } from 'lucide-react'

type Category = { id: string; name: string }
type UmkmResult = {
  user_id: string
  business_name: string
  description: string | null
  service_area: string | null
  base_price_range: string | null
  trust_score: number | null
  is_online: boolean | null
  umkm_categories: { categories: { id: string; name: string } | { id: string; name: string }[] }[]
}
type Filters = { q: string; category: string; location: string; minRating: string }

const ratingOptions = [
  { value: '', label: 'Semua rating' },
  { value: '60', label: '60+' },
  { value: '70', label: '70+' },
  { value: '80', label: '80+' },
  { value: '90', label: '90+' },
]

export function SearchPageClient({
  categories, results, initialFilters,
}: {
  categories: Category[]
  results: UmkmResult[]
  initialFilters: Filters
}) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  function applyFilters() {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.category) params.set('category', filters.category)
    if (filters.location) params.set('location', filters.location)
    if (filters.minRating) params.set('minRating', filters.minRating)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Cari UMKM & Jasa</h1>

      {/* Filter bar */}
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Kata kunci</Label>
            <Input
              placeholder="Nama usaha atau deskripsi..."
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select
              value={filters.category || null}
              onValueChange={(value) => setFilters((f) => ({ ...f, category: value ?? '' }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua kategori">
                  {(value: string | null) => categories.find((c) => c.id === value)?.name ?? 'Semua kategori'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Lokasi</Label>
            <Input
              placeholder="mis. Laweyan"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rating minimum</Label>
            <Select
              value={filters.minRating || null}
              onValueChange={(value) => setFilters((f) => ({ ...f, minRating: value ?? '' }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua rating">
                  {(value: string | null) => ratingOptions.find((r) => r.value === value)?.label ?? 'Semua rating'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end md:col-span-5">
            <Button onClick={applyFilters} className="w-full md:w-auto">
              <SearchIcon className="mr-1.5 size-4" /> Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Toolbar: hasil count + grid/list toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{results.length} UMKM ditemukan</p>
        <div className="flex gap-1">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('grid')}>
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => setView('list')}>
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Gak ada hasil yang cocok. Coba ubah filter kamu.
          </CardContent>
        </Card>
      )}

      <div className={view === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
        {results.map((u) => {
          const cats = u.umkm_categories
            ?.map((uc) => (Array.isArray(uc.categories) ? uc.categories[0] : uc.categories))
            .filter(Boolean)

          return (
            <Link key={u.user_id} href={`/umkm/${u.user_id}`}>
              <Card className={view === 'list' ? 'hover:bg-muted/50' : 'h-full transition-all hover:-translate-y-0.5 hover:shadow-md'}>
                <CardContent className={view === 'list' ? 'flex items-center justify-between gap-4 pt-6' : 'pt-6'}>
                  <div>
                    <p className="font-medium">{u.business_name}</p>
                    {u.service_area && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {u.service_area}
                      </p>
                    )}
                    {u.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{u.description}</p>
                    )}
                    {cats && cats.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {/* 
                          DI SINI PERUBAHANNYA: 
                          Mengganti "c: any" menjadi "c: Category"
                        */}
                        {cats.map((c: Category) => (
                          <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                        ))}
                      </div>
                    )}
                    {u.base_price_range && (
                      <p className="mt-2 text-sm font-medium">{u.base_price_range}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="flex shrink-0 items-center gap-1">
                    <Star className="size-3 fill-current" /> {u.trust_score ?? 0}/100
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
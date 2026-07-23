'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type Category = { id: string; name: string }

export function ImpactFilters({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPeriod = searchParams.get('period') ?? '30'
  const currentCategory = searchParams.get('category') ?? 'all'

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const periodLabels: Record<string, string> = { '7': '7 hari terakhir', '30': '30 hari terakhir', '90': '90 hari terakhir' }
  const categoryLabels: Record<string, string> = { all: 'Semua Kategori', ...Object.fromEntries(categories.map((c) => [c.id, c.name])) }

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <Select value={currentPeriod} onValueChange={(v) => updateParam('period', v ?? '30')}>
        <SelectTrigger className="w-48">
          <SelectValue>{(v: string | null) => periodLabels[v ?? '30'] ?? 'Pilih periode'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7 hari terakhir</SelectItem>
          <SelectItem value="30">30 hari terakhir</SelectItem>
          <SelectItem value="90">90 hari terakhir</SelectItem>
        </SelectContent>
      </Select>

      <Select value={currentCategory} onValueChange={(v) => updateParam('category', v ?? 'all')}>
        <SelectTrigger className="w-56">
          <SelectValue>{(v: string | null) => categoryLabels[v ?? 'all'] ?? 'Pilih kategori'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kategori</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
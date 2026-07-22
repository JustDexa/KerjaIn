import { createClient } from '@/lib/supabase/server'
import { CategoryRow } from '@/components/shared/category-row'
import { AddCategoryDialog } from '@/components/shared/add-category-dialog'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manajemen Kategori</h1>
        <AddCategoryDialog />
      </div>

      <div className="space-y-3">
        {categories?.map((cat) => (
          <CategoryRow key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}
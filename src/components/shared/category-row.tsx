'use client'

import { useState } from 'react'
import { toggleCategoryStatus } from '@/lib/actions/admin-categories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { CategoryForm } from '@/components/shared/category-form'

type Category = { id: string; name: string; type: string; is_active: boolean }

export function CategoryRow({ category }: { category: Category }) {
  const [editOpen, setEditOpen] = useState(false)

  async function handleToggle() {
    const formData = new FormData()
    formData.set('id', category.id)
    formData.set('isActive', String(category.is_active))
    await toggleCategoryStatus(formData)
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-4">
        <div>
          <p className="font-medium">{category.name}</p>
          <div className="mt-1 flex gap-2">
            <Badge variant="secondary">{category.type}</Badge>
            <Badge variant={category.is_active ? 'default' : 'outline'}>
              {category.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline">Edit</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Kategori</DialogTitle></DialogHeader>
              <CategoryForm existing={category} onDone={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" onClick={handleToggle}>
            {category.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { CategoryForm } from '@/components/shared/category-form'

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Tambah Kategori</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>Tambah Kategori Baru</DialogTitle></DialogHeader>
        <CategoryForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
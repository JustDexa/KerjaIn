'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { EditProfileForm } from '@/components/shared/edit-profile-form'
import { Pencil } from 'lucide-react'

type Props = {
  role: string
  userId: string
  userData: { full_name: string | null; phone: string | null; avatar_url?: string | null }
  umkmData?: {
    business_name: string | null
    description: string | null
    service_area: string | null
    offering_type: string | null
    base_price_range: string | null
    operational_hours: string | null
  } | null
}

export function EditProfileDialog(props: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm"><Pencil className="mr-1.5 size-4" />Edit Profil</Button>
      } />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Profil</DialogTitle></DialogHeader>
        <EditProfileForm {...props} />
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { deleteListing } from '@/lib/actions/listings'
import { Button } from '@/components/ui/button'

export function DeleteListingButton({ id }: { id: string }) {
  const handleDelete = async (formData: FormData) => {
    const listingId = formData.get('id') as string

    await deleteListing(listingId)
  }

  return (
    <form
      action={handleDelete}
      onSubmit={(e) => {
        if (!confirm('Yakin mau hapus listing ini?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="outline" size="sm" className="text-red-500">
        Hapus
      </Button>
    </form>
  )
}
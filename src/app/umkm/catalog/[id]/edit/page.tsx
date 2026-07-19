import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/shared/listing-form'
import { notFound } from 'next/navigation'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit Listing</h1>
      <ListingForm existing={listing} />
    </div>
  )
}
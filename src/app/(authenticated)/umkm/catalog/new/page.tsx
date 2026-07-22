import { ListingForm } from '@/components/shared/listing-form'

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Tambah Listing</h1>
      <ListingForm />
    </div>
  )
}
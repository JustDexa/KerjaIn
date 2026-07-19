import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteListingButton } from '@/components/shared/delete-listing-button'

export default async function CatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('umkm_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kelola Katalog</h1>
        <Link href="/umkm/catalog/new"><Button>+ Tambah Listing</Button></Link>
      </div>

      {(!listings || listings.length === 0) && (
        <p className="text-muted-foreground">Belum ada listing. Klik &quot;+ Tambah Listing&quot; buat mulai.</p>
      )}

      <div className="space-y-4">
        {listings?.map((l) => (
          <Card key={l.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{l.title}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{l.type}</Badge>
                <Badge variant="outline">{l.transaction_type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{l.description}</p>
              {l.price && (
                <p className="mt-2 text-sm font-medium">
                  Rp{Number(l.price).toLocaleString('id-ID')} {l.price_unit}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Link href={`/umkm/catalog/${l.id}/edit`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
                <DeleteListingButton id={l.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
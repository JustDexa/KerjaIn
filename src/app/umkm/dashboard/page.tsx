import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/lib/actions/auth'

export default async function UmkmDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('umkm_profiles')
    .select('business_name, trust_score')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard — {profile?.business_name}</h1>
        <form action={signOut}><Button variant="outline" size="sm">Logout</Button></form>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Trust Score</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{profile?.trust_score ?? 0}/100</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Katalog</CardTitle></CardHeader>
          <CardContent>
            <Link href="/umkm/catalog" className="text-sm underline">Kelola Katalog →</Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex gap-3">
        <Link href="/profile"><Button variant="outline">Edit Profil</Button></Link>
        <Link href={`/umkm/${user!.id}`}><Button variant="outline">Lihat Profil Publik Saya</Button></Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Dashboard ini masih versi ringkas — notifikasi job masuk, snapshot pesan, dan growth insight nyusul di Fase 8.
      </p>
    </div>
  )
}
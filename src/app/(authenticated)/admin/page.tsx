import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalUmkm },
    { count: totalJobs },
    { count: openJobs },
    { count: totalTransactions },
    { count: completedTransactions },
    { count: totalReviews },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'umkm'),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }),
    supabase.from('job_postings').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Total User (Pelanggan)', value: totalUsers ?? 0 },
    { label: 'Total UMKM', value: totalUmkm ?? 0 },
    { label: 'Total Job Posting', value: totalJobs ?? 0 },
    { label: 'Job Masih Terbuka', value: openJobs ?? 0 },
    { label: 'Total Transaksi', value: totalTransactions ?? 0 },
    { label: 'Transaksi Selesai', value: completedTransactions ?? 0 },
    { label: 'Total Review', value: totalReviews ?? 0 },
  ]

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <form action={signOut}><Button variant="outline" size="sm">Logout</Button></form>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Bagian ini yang ditambahkan */}
      <div className="mt-6 flex gap-4">
        <Link href="/admin/categories"><Button variant="outline">Kelola Kategori</Button></Link>
        <Link href="/admin/verifications"><Button variant="outline">Review KTP</Button></Link>
      </div>
    </div>
  )
}
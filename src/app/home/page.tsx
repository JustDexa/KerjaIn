import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Halo, {profile?.full_name} 👋</h1>
      <p className="text-muted-foreground">Role kamu: {profile?.role}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/ai-chat"><Button>🤖 Cari via AI</Button></Link>
        <Link href="/my-jobs"><Button variant="outline">Postingan Saya</Button></Link>
        <Link href="/transactions"><Button variant="outline">Riwayat Transaksi</Button></Link>
        <Link href="/chat"><Button variant="outline">Pesan</Button></Link>
        <form action={signOut}><Button type="submit" variant="outline">Logout</Button></form>
      </div>
    </div>
  )
}
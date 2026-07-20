import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ChatInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: asUser } = await supabase
    .from('conversations')
    .select('*, umkm_profiles(business_name)')
    .eq('user_id', user!.id)

  const { data: asUmkm } = await supabase
    .from('conversations')
    .select('*, users(full_name)')
    .eq('umkm_id', user!.id)

  const conversations = [
    ...(asUser ?? []).map((c) => ({ id: c.id, name: c.umkm_profiles?.business_name ?? 'UMKM', createdAt: c.created_at })),
    ...(asUmkm ?? []).map((c) => ({ id: c.id, name: c.users?.full_name ?? 'User', createdAt: c.created_at })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Pesan</h1>

      {conversations.length === 0 && <p className="text-muted-foreground">Belum ada percakapan.</p>}

      <div className="space-y-2">
        {conversations.map((c) => (
          <Link key={c.id} href={`/chat/${c.id}`}>
            <Card className="hover:bg-muted/50">
              <CardHeader><CardTitle className="text-base">{c.name}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString('id-ID')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
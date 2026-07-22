import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthenticatedShell } from '@/components/shared/authenticated-shell'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, avatar_url')
    .eq('id', user.id)
    .single()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <AuthenticatedShell
      role={(profile?.role as 'user' | 'umkm' | 'admin') ?? 'user'}
      fullName={profile?.full_name ?? ''}
      avatarUrl={profile?.avatar_url ?? null}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </AuthenticatedShell>
  )
}
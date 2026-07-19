import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

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
      <form action={signOut} className="mt-4">
        <Button type="submit" variant="outline">Logout</Button>
      </form>
    </div>
  )
}
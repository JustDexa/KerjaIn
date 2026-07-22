import { createClient } from '@/lib/supabase/server'
import { markNotificationRead } from '@/lib/actions/notifications'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Notifikasi</h1>

      {(!notifications || notifications.length === 0) && (
        <p className="text-sm text-muted-foreground">Belum ada notifikasi.</p>
      )}

      <div className="space-y-2">
        {notifications?.map((n) => (
          <form key={n.id} action={markNotificationRead}>
            <input type="hidden" name="id" value={n.id} />
            <input type="hidden" name="link" value={n.link ?? ''} />
            <button type="submit" className="w-full text-left">
              <Card className={n.is_read ? 'opacity-60' : ''}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <Bell className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
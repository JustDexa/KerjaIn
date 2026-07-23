/* eslint-disable react-hooks/purity */
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VerificationReviewRow } from '@/components/shared/verification-review-row'
import { MonitoringLiveBadge } from '@/components/shared/monitoring-live-badge'
import { Users, Activity, UserCheck, Store } from 'lucide-react'

type UserRelation = { full_name: string | null; role: string | null }

function normalizeUserRelation(u: UserRelation | UserRelation[] | null | undefined): UserRelation | null {
  if (!u) return null
  return Array.isArray(u) ? (u[0] ?? null) : u
}

export default async function AdminMonitoringPage() {
  const supabase = await createClient()

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [
    { data: activeUserRows },
    { count: activityToday },
    { count: totalUsers },
    { count: totalUmkm },
    { data: recentActivity },
    { data: roleDistribution },
    { data: pendingVerifications },
  ] = await Promise.all([
    supabase.from('activity_logs').select('user_id').gte('created_at', yesterday),
    supabase.from('activity_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'umkm'),
    supabase.from('activity_logs').select('*, users(full_name)').order('created_at', { ascending: false }).limit(10),
    supabase.from('activity_logs').select('role').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('verification_documents')
      .select('id, user_id, ktp_photo_url, selfie_photo_url, users!verification_documents_user_id_fkey(full_name, role)')
      .eq('status', 'pending'),
  ])

  const activeUserCount = new Set((activeUserRows ?? []).map((r) => r.user_id)).size

  const roleCounts = { user: 0, umkm: 0, admin: 0 }
  roleDistribution?.forEach((r) => {
    if (r.role in roleCounts) roleCounts[r.role as keyof typeof roleCounts]++
  })
  const totalRoleActivity = roleCounts.user + roleCounts.umkm + roleCounts.admin || 1

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitoring Aktivitas</h1>
        <MonitoringLiveBadge />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><Users className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Pengguna Aktif (24 jam)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{activeUserCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><Activity className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Aktivitas Hari Ini</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{activityToday ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><UserCheck className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Total User</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalUsers ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2"><Store className="h-4 w-4" /><CardTitle className="text-sm text-muted-foreground">Total UMKM</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalUmkm ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Distribusi Aktivitas per Role (7 hari)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(['user', 'umkm', 'admin'] as const).map((role) => (
            <div key={role}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="capitalize">{role}</span>
                <span className="text-muted-foreground">{roleCounts[role]}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-foreground"
                  style={{ width: `${(roleCounts[role] / totalRoleActivity) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {pendingVerifications && pendingVerifications.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Verifikasi Menunggu ({pendingVerifications.length})</h2>
          <div className="space-y-3">
            {await Promise.all(
              pendingVerifications.map(async (doc: { id: string; user_id: string; ktp_photo_url: string | null; selfie_photo_url: string | null; users: UserRelation | UserRelation[] | null }) => {
                let signedKtpUrl: string | null = null
                let signedSelfieUrl: string | null = null

                if (doc.ktp_photo_url) {
                  const { data: signed } = await supabase.storage.from('verification-docs').createSignedUrl(doc.ktp_photo_url, 60 * 10)
                  signedKtpUrl = signed?.signedUrl ?? null
                }
                if (doc.selfie_photo_url) {
                  const { data: signed } = await supabase.storage.from('verification-docs').createSignedUrl(doc.selfie_photo_url, 60 * 10)
                  signedSelfieUrl = signed?.signedUrl ?? null
                }

                const userInfo = normalizeUserRelation(doc.users)

                return (
                  <VerificationReviewRow
                    key={doc.id}
                    doc={{ id: doc.id, user_id: doc.user_id, full_name: userInfo?.full_name ?? null, role: userInfo?.role ?? null, ktp_photo_url: signedKtpUrl, selfie_photo_url: signedSelfieUrl }}
                  />
                )
              })
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Aktivitas Terbaru</h2>
        <div className="space-y-2">
          {(!recentActivity || recentActivity.length === 0) && (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
          )}
          {recentActivity?.map((a: { id: string; role: string; created_at: string; description: string }) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between pt-4 text-sm">
                <span>{a.description}</span>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline" className="capitalize">{a.role}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleTimeString('id-ID')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
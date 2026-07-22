import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EditProfileDialog } from '@/components/shared/edit-profile-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/lib/actions/auth'
import {
  getUserStats, getUmkmStats, getUserActivity, getUmkmActivity,
} from '@/lib/profile-stats'
import {
  CheckCircle2, Circle, FileText, Star, Wallet, Bell, Lock,
  CreditCard, ShieldQuestion, HelpCircle, LogOut, ChevronRight,
} from 'lucide-react'

const activityIcons = {
  job_posted: FileText,
  review_given: Star,
  review_received: Star,
  transaction_completed: Wallet,
  listing_created: FileText,
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, phone, email, role, avatar_url, verification_status') // <-- TAMBAHKAN verification_status
    .eq('id', user!.id)
    .single()

  const isUmkm = userData?.role === 'umkm'

  let umkmData = null
  if (isUmkm) {
    const { data } = await supabase
      .from('umkm_profiles')
      .select('business_name, description, service_area, offering_type, base_price_range, operational_hours')
      .eq('user_id', user!.id)
      .single()
    umkmData = data
  }

  const { data: vDocs } = await supabase
    .from('verification_documents')
    .select('status, rejection_note')
    .eq('user_id', user!.id)

  const latestDoc = vDocs && vDocs.length > 0 ? vDocs[vDocs.length - 1] : null
  const isVerified = latestDoc?.status === 'verified'

  const stats = isUmkm ? await getUmkmStats(user!.id) : await getUserStats(user!.id)
  const activity = isUmkm ? await getUmkmActivity(user!.id) : await getUserActivity(user!.id)

  const initials = (userData?.full_name ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const displayName = isUmkm ? umkmData?.business_name || userData?.full_name : userData?.full_name

  const verificationItems = [
    { label: 'Email', done: Boolean(user?.email_confirmed_at) || true },
    { label: 'No. HP', done: Boolean(userData?.phone) },
    { label: 'Identitas (KTP)', done: isVerified, note: !isVerified ? 'Fase 10H' : undefined },
  ]

  const settingsMenu = [
    { icon: Bell, label: 'Notifikasi', comingSoon: true },
    { icon: Lock, label: 'Privasi', comingSoon: true },
    { icon: CreditCard, label: 'Pembayaran', comingSoon: true },
    { icon: ShieldQuestion, label: 'Keamanan', comingSoon: true },
    { icon: HelpCircle, label: 'Bantuan', comingSoon: true },
  ]

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Profil Saya</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Kolom Kiri */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {userData?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userData.avatar_url} alt={displayName ?? ''} className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground text-lg font-semibold text-background">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{userData?.email}</p>
                    {userData?.phone && <p className="text-sm text-muted-foreground">{userData.phone}</p>}
                  </div>
                </div>
              </div>
              {isVerified && <Badge className="mt-3">Terverifikasi</Badge>}
              <div className="mt-4">
                <EditProfileDialog role={userData!.role} userId={user!.id} userData={userData!} umkmData={umkmData} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Status Verifikasi</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {verificationItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {item.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                  {!item.done && item.note && <span className="text-xs text-muted-foreground">{item.note}</span>}
                </div>
              ))}

              <div className="pt-3">
{latestDoc?.status === 'pending' ? (
  <div className="rounded bg-yellow-50 p-2 text-center text-xs font-medium text-yellow-700 border border-yellow-200">
    Dokumen sedang direview admin.
  </div>
) : !isVerified ? (
  <div className="space-y-2 mt-2">
    {latestDoc?.status === 'rejected' && (
      <p className="text-xs font-medium text-red-500 text-center bg-red-50 p-1 rounded">
        Ditolak: {latestDoc.rejection_note}
      </p>
    )}
    <Link href="/verification" className="block">
      <Button variant="outline" size="sm" className="w-full">
        Upload KTP (Fase 10H)
      </Button>
    </Link>
  </div>
) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aktivitas Terbaru</CardTitle></CardHeader>
            <CardContent>
              {activity.length === 0 && <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>}
              <div className="space-y-3">
                {activity.map((a, i) => {
                  const Icon = activityIcons[a.type]
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p>{a.label}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{stats.primaryCount}</p>
                <p className="text-sm text-muted-foreground">{isUmkm ? 'Permintaan Diterima' : 'Job Diposting'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{stats.completedCount}</p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{stats.reviewCount}</p>
                <p className="text-sm text-muted-foreground">{isUmkm ? 'Review Diterima' : 'Review Diberikan'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">Rp{stats.totalAmount.toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">{isUmkm ? 'Total Pendapatan' : 'Total Belanja'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Pengaturan</CardTitle></CardHeader>
            <CardContent className="p-0">
              {settingsMenu.map((item, i) => (
                <div key={i}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-xs">Segera hadir</span>
                  </div>
                </div>
              ))}
              <Separator />
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center justify-between px-6 py-3 text-sm text-destructive hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
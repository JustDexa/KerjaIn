import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ApplyJobForm } from '@/components/shared/apply-job-form'
import { jobStatusLabel, applicationStatusLabel } from '@/lib/status-labels'
import { ApplicationList } from '@/components/shared/application-list'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createOrGetTransaction } from '@/lib/actions/transactions'
import { MessageCircle, CreditCard, MapPin, Wallet } from 'lucide-react'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('job_postings')
    .select('*, categories(name), users(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const { data: userData } = await supabase.from('users').select('role').eq('id', user!.id).single()
  const isOwner = job.user_id === user!.id
  const isUmkm = userData?.role === 'umkm'

  let myApplication = null
  if (isUmkm) {
    const { data } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_posting_id', id)
      .eq('umkm_id', user!.id)
      .maybeSingle()
    myApplication = data
  }

  type Application = {
    id: string
    comment: string | null
    status: string
    umkm_id: string
    umkm_profiles: { business_name: string; trust_score: number; users: { avatar_url: string | null } | { avatar_url: string | null }[] | null } | null
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('job_posting_id', id)
    .maybeSingle()

  const { data: transaction } = await supabase
    .from('transactions')
    .select('id, status, payment_status')
    .eq('job_posting_id', id)
    .maybeSingle()

  let applications: Application[] = []
  if (isOwner) {
    const { data } = await supabase
      .from('job_applications')
      .select('*, umkm_profiles(business_name, trust_score, users(avatar_url))')
      .eq('job_posting_id', id)
      .order('created_at', { ascending: false })
    applications = data ?? []
  }

  const poster = Array.isArray(job.users) ? job.users[0] : job.users

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="animate-fade-in-up mb-4 flex items-center gap-2">
        <Badge variant="secondary">{job.categories?.name}</Badge>
        {job.is_urgent && <Badge variant="destructive">Urgent</Badge>}
        <Badge variant="outline">{jobStatusLabel(job.status)}</Badge>
      </div>

      <div className="animate-fade-in-up mb-4">
        <h1 className="mb-1 text-xl font-bold">{job.title ?? job.description.slice(0, 60)}</h1>
        <p className="mb-3 text-sm text-muted-foreground">{job.description}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
          {(job.budget_min || job.budget_max) && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              Rp{Number(job.budget_min ?? 0).toLocaleString('id-ID')} - Rp{Number(job.budget_max ?? 0).toLocaleString('id-ID')}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {poster?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster.avatar_url} alt={poster.full_name ?? ''} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
              {poster?.full_name?.slice(0, 1).toUpperCase() ?? '?'}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Diposting oleh {poster?.full_name}</p>
        </div>
      </div>

      {conversation && (job.status === 'deal' || job.status === 'completed') && (
        <div className="animate-fade-in-up mb-4 flex flex-wrap gap-2">
          <Link href={`/chat/${conversation.id}`}>
            <Button size="sm"><MessageCircle className="mr-2 h-4 w-4" />Buka Chat</Button>
          </Link>
          {isOwner && job.status === 'deal' && !transaction && (
            <form action={async (formData) => {
              'use server'
              const result = await createOrGetTransaction(formData)
              if (result?.error) console.error('[checkout error]', result.error)
            }}>
              <input type="hidden" name="jobPostingId" value={job.id} />
              <Button type="submit" size="sm" variant="secondary"><CreditCard className="mr-2 h-4 w-4" />Checkout & Bayar</Button>
            </form>
          )}
          {transaction && (
            <Link href={transaction.payment_status === 'pending' ? `/checkout/${transaction.id}` : `/transactions/${transaction.id}`}>
              <Button size="sm" variant="secondary">
                <CreditCard className="mr-2 h-4 w-4" />
                {transaction.status === 'completed' ? 'Lihat Transaksi' : isUmkm && !isOwner ? 'Kelola Transaksi' : 'Lihat Pembayaran'}
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="animate-fade-in-up mt-6">
        {isOwner && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Pelamar ({applications.length})</h2>
            {applications.length === 0 && <p className="text-sm text-muted-foreground">Belum ada yang apply.</p>}
            <ApplicationList applications={applications} jobPostingId={id} jobStatus={job.status} />
          </>
        )}

        {isUmkm && !isOwner && job.status === 'open' && !myApplication && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Apply ke Permintaan Ini</h2>
            <ApplyJobForm jobPostingId={id} />
          </>
        )}

        {isUmkm && myApplication && (
          <p className="text-sm text-muted-foreground">
            Status apply anda: <Badge variant="outline">{applicationStatusLabel(myApplication.status)}</Badge>
          </p>
        )}

        {isUmkm && !isOwner && job.status !== 'open' && !myApplication && (
          <p className="text-sm text-muted-foreground">Permintaan ini udah gak nerima pelamar baru.</p>
        )}
      </div>
    </div>
  )
}
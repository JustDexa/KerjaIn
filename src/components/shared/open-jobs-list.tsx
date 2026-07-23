'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

type PosterInfo = { full_name: string | null; avatar_url: string | null } | null

type OpenJob = {
  id: string
  title: string | null
  description: string
  location: string
  is_urgent: boolean
  category_id: string
  categories: { name: string } | null
  users: PosterInfo
}

function normalizeUser(u: PosterInfo | PosterInfo[] | null | undefined): PosterInfo {
  if (!u) return null
  return Array.isArray(u) ? (u[0] ?? null) : u
}

export function OpenJobsList({ initialJobs }: { initialJobs: OpenJob[] }) {
  const [jobs, setJobs] = useState<OpenJob[]>(initialJobs)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isCancelled = false

    async function setupRealtime() {
      const { data: { session } } = await supabase.auth.getSession()
      if (isCancelled) return

      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token)
      }

      if (isCancelled) return

      channel = supabase
        .channel('open-job-postings')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'job_postings',
            filter: 'status=eq.open',
          },
          async (payload) => {
            const newJob = payload.new as { id: string; description: string; location: string; is_urgent: boolean; category_id: string; user_id: string }

            const [{ data: category }, { data: poster }] = await Promise.all([
              supabase.from('categories').select('name').eq('id', newJob.category_id).maybeSingle(),
              supabase.from('users').select('full_name, avatar_url').eq('id', newJob.user_id).maybeSingle(),
            ])

            setJobs((prev) => {
              if (prev.some((j) => j.id === newJob.id)) return prev
              return [{ ...newJob, categories: category, users: poster }, ...prev]
            })
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      isCancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada permintaan terbuka.</p>
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const poster = normalizeUser(job.users)
        return (
          <Link key={job.id} href={`/job/${job.id}`}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="pt-5">
                <div className="mb-3 flex items-start justify-between gap-3">
<h3 className="font-semibold leading-snug">{job.title ?? job.description.slice(0, 80)}</h3>                  {job.is_urgent && <Badge variant="destructive" className="shrink-0">Urgent</Badge>}
                </div>

                <p className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Badge variant="secondary">{job.categories?.name}</Badge>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                </p>

                <div className="flex items-center gap-2 border-t pt-3">
                  {poster?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster.avatar_url} alt={poster.full_name ?? ''} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                      {poster?.full_name?.slice(0, 1).toUpperCase() ?? '?'}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">{poster?.full_name ?? 'Pengguna'}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
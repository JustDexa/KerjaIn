'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type OpenJob = {
  id: string
  description: string
  location: string
  is_urgent: boolean
  category_id: string
  categories: { name: string } | null
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
            const newJob = payload.new as { id: string; description: string; location: string; is_urgent: boolean; category_id: string }
            const { data: category } = await supabase
              .from('categories')
              .select('name')
              .eq('id', newJob.category_id)
              .maybeSingle()

            setJobs((prev) => {
              if (prev.some((j) => j.id === newJob.id)) return prev
              return [{ ...newJob, categories: category }, ...prev]
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
    <>
      {jobs.map((job) => (
        <Link key={job.id} href={`/job/${job.id}`}>
          <Card className="hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{job.description.slice(0, 60)}</CardTitle>
              {job.is_urgent && <Badge variant="destructive">Urgent</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{job.categories?.name} · {job.location}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  )
}

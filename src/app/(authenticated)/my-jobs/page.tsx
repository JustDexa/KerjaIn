import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { jobStatusLabel } from '@/lib/status-labels'

export default async function MyJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('job_postings')
    .select('*, categories(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Postingan Saya</h1>
        <Link href="/job/new"><Button>+ Buat Permintaan</Button></Link>
      </div>

      {(!jobs || jobs.length === 0) && <p className="text-muted-foreground">Belum ada postingan.</p>}

      <div className="space-y-3">
        {jobs?.map((job) => (
          <Link key={job.id} href={`/job/${job.id}`}>
            <Card className="hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{job.title ?? job.description.slice(0, 60)}</CardTitle>
                <Badge variant="outline">{jobStatusLabel(job.status)}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{job.categories?.name} · {job.location}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
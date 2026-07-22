import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function UmkmRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: openJobs } = await supabase
    .from('job_postings')
    .select('*, categories(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const { data: myApplications } = await supabase
    .from('job_applications')
    .select('*, job_postings(id, description, location, status, categories(name))')
    .eq('umkm_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Permintaan Masuk</h1>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open Jobs</TabsTrigger>
          <TabsTrigger value="applied">Job Masuk (Sudah Apply)</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 space-y-3">
          {(!openJobs || openJobs.length === 0) && <p className="text-sm text-muted-foreground">Belum ada permintaan terbuka.</p>}
          {openJobs?.map((job) => (
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
        </TabsContent>

        <TabsContent value="applied" className="mt-4 space-y-3">
          {(!myApplications || myApplications.length === 0) && <p className="text-sm text-muted-foreground">Belum pernah apply.</p>}
          {myApplications?.map((app: {
            id: string
            status: string
            job_postings: { id: string; description: string; location: string; categories: { name: string } | null } | null
            }) => (
            <Link key={app.id} href={`/job/${app.job_postings?.id}`}>
              <Card className="hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{app.job_postings?.description?.slice(0, 60)}</CardTitle>
                  <Badge variant="outline">{app.status}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{app.job_postings?.categories?.name} · {app.job_postings?.location}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
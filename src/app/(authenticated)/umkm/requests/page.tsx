import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpenJobsList } from '@/components/shared/open-jobs-list'
import { applicationStatusLabel, transactionStatusLabel, paymentStatusLabel } from '@/lib/status-labels'

function TabCountBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
      {count}
    </span>
  )
}

export default async function UmkmRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: openJobs } = await supabase
    .from('job_postings')
    .select('*, categories(name), users(full_name, avatar_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const { data: myApplications } = await supabase
    .from('job_applications')
    .select('*, job_postings(id, title, description, location, status, categories(name))')
    .order('created_at', { ascending: false })

  const { data: directOrders } = await supabase
    .from('transactions')
    .select('id, total_amount, status, payment_status, created_at, listings(title), transaction_items(title, quantity)')
    .eq('umkm_id', user!.id)
    .is('job_posting_id', null)
    .order('created_at', { ascending: false })

  const openJobsCount = openJobs?.length ?? 0
  const appliedCount = myApplications?.length ?? 0
  const activeOrdersCount = directOrders?.filter((o) => o.status !== 'completed').length ?? 0

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="animate-fade-in-up mb-6 text-2xl font-bold">Permintaan Masuk</h1>

      <Tabs defaultValue="open" className="animate-fade-in-up">
        <TabsList className="gap-1">
          <TabsTrigger value="open" className="gap-0">
            Open Jobs<TabCountBadge count={openJobsCount} />
          </TabsTrigger>
          <TabsTrigger value="applied" className="gap-0">
            Job Masuk<TabCountBadge count={appliedCount} />
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-0">
            Pesanan Katalog<TabCountBadge count={activeOrdersCount} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6 space-y-3">
          <OpenJobsList initialJobs={openJobs ?? []} />
        </TabsContent>

        <TabsContent value="applied" className="mt-6 space-y-3">
          {(!myApplications || myApplications.length === 0) && <p className="text-sm text-muted-foreground">Belum pernah apply.</p>}
          {myApplications?.map((app: {
            id: string
            status: string
            job_postings: { id: string; title: string | null; description: string; location: string; categories: { name: string } | null } | null
            }) => (
            <Link key={app.id} href={`/job/${app.job_postings?.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{app.job_postings?.title ?? app.job_postings?.description?.slice(0, 60)}</CardTitle>
                  <Badge variant="outline">{applicationStatusLabel(app.status)}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{app.job_postings?.categories?.name} · {app.job_postings?.location}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="orders" className="mt-6 space-y-3">
          {(!directOrders || directOrders.length === 0) && <p className="text-sm text-muted-foreground">Belum ada pesanan langsung dari katalog.</p>}
          {directOrders?.map((order) => {
            const items = order.transaction_items as { title: string; quantity: number }[] | null
            const singleListing = order.listings as unknown as { title: string } | null
            const itemsLabel = items && items.length > 0
              ? items.map((i) => `${i.title}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ')
              : singleListing?.title ?? 'Pesanan'

            return (
              <Link key={order.id} href={`/transactions/${order.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <CardTitle className="text-base">{itemsLabel}</CardTitle>
                    <Badge variant={order.status === 'completed' ? 'default' : 'outline'} className="shrink-0">
                      {transactionStatusLabel(order.status)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Rp{Number(order.total_amount ?? 0).toLocaleString('id-ID')} · {paymentStatusLabel(order.payment_status)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
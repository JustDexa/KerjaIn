'use client'

import { acceptApplication, rejectApplication } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Application = {
  id: string
  comment: string | null
  status: string
  umkm_id: string
  umkm_profiles: { business_name: string; trust_score: number } | null
}

export function ApplicationList({
  applications,
  jobPostingId,
  jobStatus,
}: {
  applications: Application[]
  jobPostingId: string
  jobStatus: string
}) {
  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <Card key={app.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{app.umkm_profiles?.business_name ?? 'UMKM'}</CardTitle>
            <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'outline' : 'secondary'}>
              {app.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Trust Score: {app.umkm_profiles?.trust_score ?? 0}/100</p>
            <p className="mt-2 text-sm">{app.comment}</p>

            {jobStatus === 'has_candidates' && app.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <form action={async (formData) => { await acceptApplication(formData) }}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <input type="hidden" name="jobPostingId" value={jobPostingId} />
                  <input type="hidden" name="umkmId" value={app.umkm_id} />
                  <Button type="submit" size="sm">Terima</Button>
                </form>
                <form action={rejectApplication}>
                  <input type="hidden" name="applicationId" value={app.id} />
                  <input type="hidden" name="jobPostingId" value={jobPostingId} />
                  <Button type="submit" size="sm" variant="outline">Tolak</Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
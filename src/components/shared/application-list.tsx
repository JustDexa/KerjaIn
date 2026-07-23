'use client'

import { acceptApplication, rejectApplication } from '@/lib/actions/jobs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { applicationStatusLabel } from '@/lib/status-labels'
import { Check, X } from 'lucide-react'
import { trustScoreBadgeClass } from '@/lib/trust-score-colors'

type Application = {
  id: string
  comment: string | null
  status: string
  umkm_id: string
  umkm_profiles: { business_name: string; trust_score: number; users: { avatar_url: string | null } | { avatar_url: string | null }[] | null } | null
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
      {applications.map((app) => {
        const umkmUser = Array.isArray(app.umkm_profiles?.users) ? app.umkm_profiles?.users[0] : app.umkm_profiles?.users
        const businessName = app.umkm_profiles?.business_name ?? 'UMKM'
        const trustScore = app.umkm_profiles?.trust_score ?? 0

        return (
          <Card key={app.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {umkmUser?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={umkmUser.avatar_url} alt={businessName} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                      {businessName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{businessName}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${trustScoreBadgeClass(trustScore)}`}>
                      Trust Score {trustScore}/100
                    </span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  app.status === 'accepted' ? 'bg-success/10 text-success' :
                  app.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {applicationStatusLabel(app.status)}
                </span>
              </div>

              {app.comment && (
                <p className="mt-3 rounded-md bg-muted/30 p-2.5 text-sm text-muted-foreground">&ldquo;{app.comment}&rdquo;</p>
              )}

              {jobStatus === 'has_candidates' && app.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <form action={async (formData: FormData) => { await acceptApplication(formData) }}>
                    <input type="hidden" name="applicationId" value={app.id} />
                    <input type="hidden" name="jobPostingId" value={jobPostingId} />
                    <input type="hidden" name="umkmId" value={app.umkm_id} />
                    <Button type="submit" size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                      <Check className="mr-1.5 h-4 w-4" />Terima
                    </Button>
                  </form>
                  <form action={async (formData: FormData) => { await rejectApplication(formData) }}>
                    <input type="hidden" name="applicationId" value={app.id} />
                    <input type="hidden" name="jobPostingId" value={jobPostingId} />
                    <Button type="submit" size="sm" variant="outline">
                      <X className="mr-1.5 h-4 w-4" />Tolak
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
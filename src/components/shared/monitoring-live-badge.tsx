'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function MonitoringLiveBadge() {
  const router = useRouter()
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let isCancelled = false

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession()
      if (isCancelled) return
      if (session?.access_token) supabase.realtime.setAuth(session.access_token)
      if (isCancelled) return

      channel = supabase
        .channel('activity-logs-monitoring')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_logs' },
          () => {
            setPulse(true)
            router.refresh()
            setTimeout(() => setPulse(false), 1500)
          }
        )
        .subscribe()
    }

    setup()

    return () => {
      isCancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [router])

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`h-2 w-2 rounded-full bg-green-500 ${pulse ? 'animate-ping' : ''}`} />
      Live
    </span>
  )
}
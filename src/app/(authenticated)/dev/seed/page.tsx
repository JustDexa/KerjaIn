'use client'

import { useState } from 'react'
import { seedDummyData } from '@/lib/actions/seed'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState('')

  async function handleSeed() {
    setLoading(true)
    setError('')
    const result = await seedDummyData()
    if (result?.error) setError(result.error)
    if (result?.log) setLog(result.log)
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-2 text-2xl font-bold">Seed Data Dummy</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Halaman development — generate UMKM, customer, transaksi & review dummy buat demo.
      </p>

      <Button onClick={handleSeed} disabled={loading}>
        {loading ? 'Sedang membuat data...' : 'Jalankan Seed'}
      </Button>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {log.length > 0 && (
        <Card className="mt-4">
          <CardContent className="space-y-1 pt-6 text-sm">
            {log.map((line, i) => <p key={i}>{line}</p>)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
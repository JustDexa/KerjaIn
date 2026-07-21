'use client'

import { useEffect, useRef, useState } from 'react'
import { saveExtractedRequirement } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type ExtractedRequirement = {
  category: string | null
  description: string | null
  location: string | null
  budget_min: number | null
  budget_max: number | null
  is_urgent: boolean
}

export function AiChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Halo! Ceritain kebutuhan kamu — mau cari jasa atau barang apa hari ini?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedRequirement | null>(null)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
      if (data.extracted) setExtracted(data.extracted)
      setReady(Boolean(data.ready))
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Waduh, ada gangguan koneksi. Coba lagi ya.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleFindRecommendations() {
    if (!extracted) return
    setSaving(true)
    await saveExtractedRequirement(extracted)
    setSaving(false)
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-md border p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-muted-foreground">AI sedang mengetik...</p>}
        <div ref={bottomRef} />
      </div>

      {ready && extracted && (
        <div className="mt-3 rounded-md border bg-muted/50 p-3">
          <p className="mb-2 text-sm font-medium">Kebutuhan kamu udah cukup jelas nih:</p>
          <ul className="mb-3 space-y-1 text-xs text-muted-foreground">
            <li>Kategori: {extracted.category}</li>
            <li>Deskripsi: {extracted.description}</li>
            <li>Lokasi: {extracted.location}</li>
            {(extracted.budget_min || extracted.budget_max) && (
              <li>Budget: Rp{extracted.budget_min?.toLocaleString('id-ID')} - Rp{extracted.budget_max?.toLocaleString('id-ID')}</li>
            )}
          </ul>
          <Button onClick={handleFindRecommendations} disabled={saving} className="w-full">
            {saving ? 'Mencari...' : '🔍 Cari Rekomendasi UMKM'}
          </Button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ketik kebutuhan kamu..."
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading}>Kirim</Button>
      </div>
    </div>
  )
}
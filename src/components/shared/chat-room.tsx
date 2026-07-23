'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/chat'
import { createOrGetTransaction, createMultiItemTransaction } from '@/lib/actions/transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Handshake, CreditCard, Minus, Plus } from 'lucide-react'
type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
}

type Listing = { id: string; title: string; price: number | null; price_unit: string | null }

export function ChatRoom({
  conversationId,
  currentUserId,
  currentUserRole,
  initialMessages,
  jobPostingId,
  jobStatus,
  existingTransactionId,
  listings,
}: {
  conversationId: string
  currentUserId: string
  currentUserRole: 'user' | 'umkm' | 'admin'
  initialMessages: Message[]
  jobPostingId: string | null
  jobStatus: string | null
  existingTransactionId: string | null
  listings: Listing[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [dealError, setDealError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({}) // listingId -> quantity
  const bottomRef = useRef<HTMLDivElement>(null)

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
        .channel(`conversation-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMsg = payload.new as Message
            if (newMsg.sender_id === currentUserId) return
            setMessages((prev) => [...prev, newMsg])
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      isCancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(formData: FormData) {
    const content = text.trim()
    if (!content) return
    setText('')

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])

    formData.set('conversationId', conversationId)
    formData.set('content', content)
    await sendMessage(formData)
  }

  async function handleGoToJobPayment() {
    if (!jobPostingId) return
    const formData = new FormData()
    formData.set('jobPostingId', jobPostingId)
    const result = await createOrGetTransaction(formData)
    if (result?.error) setDealError(result.error)
  }

  function toggleItem(listingId: string) {
    setSelectedItems((prev) => {
      const next = { ...prev }
      if (next[listingId]) {
        delete next[listingId]
      } else {
        next[listingId] = 1
      }
      return next
    })
  }

  function changeQuantity(listingId: string, delta: number) {
    setSelectedItems((prev) => ({
      ...prev,
      [listingId]: Math.max(1, (prev[listingId] ?? 1) + delta),
    }))
  }

  async function handleConfirmDeal() {
    const listingIds = Object.keys(selectedItems)
    if (listingIds.length === 0) {
      setDealError('Pilih minimal 1 layanan')
      return
    }

    const items = listingIds.map((id) => {
      const listing = listings.find((l) => l.id === id)!
      return { listingId: id, title: listing.title, price: listing.price ?? 0, quantity: selectedItems[id] }
    })

    const formData = new FormData()
    formData.set('conversationId', conversationId)
    formData.set('items', JSON.stringify(items))
    const result = await createMultiItemTransaction(formData)
    if (result?.error) setDealError(result.error)
  }

  const showExistingPayment = currentUserRole === 'user' && !!existingTransactionId
  const showJobPayment = currentUserRole === 'user' && !existingTransactionId && !!jobPostingId && jobStatus === 'deal'
  const showDirectDeal = currentUserRole === 'user' && !existingTransactionId && !showJobPayment && listings.length > 0
  const showQuickActions = showExistingPayment || showJobPayment || showDirectDeal

  return (
    <div className="flex h-[70vh] flex-col">
      {showQuickActions && (
        <div className="mb-3 space-y-2 rounded-md border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {showExistingPayment ? (
              <Link href={`/checkout/${existingTransactionId}`}>
                <Button size="sm"><CreditCard className="mr-1.5 size-4" />Lanjut ke Pembayaran</Button>
              </Link>
            ) : showJobPayment ? (
              <Button size="sm" onClick={handleGoToJobPayment}>
                <CreditCard className="mr-1.5 size-4" />Lanjut ke Pembayaran
              </Button>
            ) : showDirectDeal && !pickerOpen ? (
              <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
                <Handshake className="mr-1.5 size-4" />Tandai Deal
              </Button>
            ) : showDirectDeal && pickerOpen ? (
              <div className="w-full space-y-2">
                <div className="space-y-1.5 rounded-md border bg-background p-2">
                  {listings.map((l) => {
                    const isSelected = Boolean(selectedItems[l.id])
                    return (
                      <div key={l.id} className="flex items-center justify-between gap-2 py-1">
                        <label className="flex flex-1 items-center gap-2 text-sm">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleItem(l.id)} />
                          <span>{l.title}{l.price ? ` — Rp${Number(l.price).toLocaleString('id-ID')}` : ''}</span>
                        </label>
                        {isSelected && (
                          <div className="flex items-center gap-1.5">
                            <Button type="button" size="icon" variant="outline" className="size-6" onClick={() => changeQuantity(l.id, -1)}>
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-4 text-center text-sm">{selectedItems[l.id]}</span>
                            <Button type="button" size="icon" variant="outline" className="size-6" onClick={() => changeQuantity(l.id, 1)}>
                              <Plus className="size-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {Object.keys(selectedItems).length > 0 && (
                  <p className="text-sm font-medium">
                    Total: Rp{listings.reduce((sum, l) => sum + (selectedItems[l.id] ? (l.price ?? 0) * selectedItems[l.id] : 0), 0).toLocaleString('id-ID')}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleConfirmDeal}>Konfirmasi Deal</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPickerOpen(false); setSelectedItems({}) }}>Batal</Button>
                </div>
              </div>
            ) : null}
          </div>
          {dealError && <p className="text-xs text-destructive">{dealError}</p>}
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto rounded-md border p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">Belum ada pesan. Mulai obrolan!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                m.sender_id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {m.content}
              <div className="mt-1 text-[10px] opacity-70">
                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form action={handleSubmit} className="mt-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pesan..."
          name="content"
        />
        <Button type="submit">Kirim</Button>
      </form>
    </div>
  )
}
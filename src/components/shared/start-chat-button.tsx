'use client'

import { useState } from 'react'
import { startDirectConversation } from '@/lib/actions/chat'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'


export function StartChatButton({ umkmId }: { umkmId: string }) {
  const [error, setError] = useState('')

  async function handleClick() {
    const formData = new FormData()
    formData.set('umkmId', umkmId)
    const result = await startDirectConversation(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div>
      <Button onClick={handleClick}><MessageCircle className="mr-2 h-4 w-4" />Mulai Chat</Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
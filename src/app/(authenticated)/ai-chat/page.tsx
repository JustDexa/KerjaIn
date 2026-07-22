import { AiChatWidget } from '@/components/shared/ai-chat-widget'

export default function AiChatPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Cari via AI Assistant</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Ceritain kebutuhan kamu, AI bakal carikan UMKM yang paling cocok.
      </p>
      <AiChatWidget />
    </div>
  )
}
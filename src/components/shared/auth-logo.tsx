import Link from 'next/link'
import { Handshake } from 'lucide-react'

export function AuthLogo() {
  return (
    <Link href="/" className="mb-8 flex flex-col items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background">
        <Handshake className="h-6 w-6" />
      </div>
      <span className="text-2xl font-bold tracking-tight">KerjaIn</span>
    </Link>
  )
}
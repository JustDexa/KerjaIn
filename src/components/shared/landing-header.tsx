import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">KerjaIn</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium">Masuk</Link>
          <Link href="/register"><Button size="sm">Daftar</Button></Link>
        </div>
      </div>
    </header>
  )
}

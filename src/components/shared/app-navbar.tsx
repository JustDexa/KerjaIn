'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, Bell, MessageSquareText, Search as SearchIcon, ChevronDown, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'

export function AppNavbar({
  fullName, avatarUrl, unreadCount, onMenuClick,
}: {
  fullName: string
  avatarUrl: string | null
  unreadCount: number
  onMenuClick: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-3 px-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="size-5" />
        </Button>

        <Link href="/home" className="shrink-0 text-lg font-bold">KerjaIn</Link>

        {/* placeholder — jadi fungsional setelah /search dibikin di Fase 10D */}
        <form action="/search" className="hidden max-w-sm flex-1 md:block">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              placeholder="Cari UMKM atau jasa..."
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="size-4.5" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <Link href="/chat">
            <Button variant="ghost" size="icon">
              <MessageSquareText className="size-4.5" />
            </Button>
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-2 hover:bg-muted"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={fullName} className="size-7 rounded-full object-cover" />
              ) : (
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {initials || <User className="size-3.5" />}
                </span>
              )}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 rounded-md border bg-popover p-1 shadow-md">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <User className="size-4" /> Edit Profil
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                  >
                    <LogOut className="size-4" /> Logout
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
'use client'

import { useState } from 'react'
import { AppNavbar } from './app-navbar'
import { AppSidebar } from './app-sidebar'

type Role = 'user' | 'umkm' | 'admin'

export function AuthenticatedShell({
  role, fullName, avatarUrl, unreadCount, children,
}: {
  role: Role
  fullName: string
  avatarUrl: string | null
  unreadCount: number
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <AppNavbar
        fullName={fullName}
        avatarUrl={avatarUrl}
        unreadCount={unreadCount}
        onMenuClick={() => setMobileOpen((v) => !v)}
      />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r md:block">
          <AppSidebar role={role} />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-10 h-full w-64 bg-background shadow-lg">
              <AppSidebar role={role} onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Sparkles, Search, Receipt, MessageSquareText, User,
  LayoutDashboard, Package, ClipboardList, TrendingUp, ShieldCheck, Tags,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'user' | 'umkm' | 'admin'
type NavItem = { label: string; href: string; icon: typeof Home }

const navByRole: Record<Role, NavItem[]> = {
  user: [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Rekomendasi AI', href: '/ai-chat', icon: Sparkles },
    { label: 'Cari', href: '/search', icon: Search },
    { label: 'Transaksi', href: '/transactions', icon: Receipt },
    { label: 'Chat', href: '/chat', icon: MessageSquareText },
    { label: 'Profil', href: '/profile', icon: User },
  ],
  umkm: [
    { label: 'Dashboard', href: '/umkm/dashboard', icon: LayoutDashboard },
    { label: 'Katalog', href: '/umkm/catalog', icon: Package },
    { label: 'Permintaan', href: '/umkm/requests', icon: ClipboardList },
    { label: 'Growth', href: '/umkm/growth', icon: TrendingUp },
    { label: 'Trust Score', href: '/umkm/trust-score', icon: ShieldCheck },
    { label: 'Chat', href: '/chat', icon: MessageSquareText },
    { label: 'Profil', href: '/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Kategori', href: '/admin/categories', icon: Tags },
  ],
}

export function AppSidebar({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname()
  const items = navByRole[role] ?? navByRole.user

  // pilih match terpanjang biar '/admin/categories' gak ikut nge-highlight 'Dashboard' (/admin)
  const activeItem = items.reduce<NavItem | null>((best, item) => {
    const matches = pathname === item.href || pathname.startsWith(item.href + '/')
    if (!matches) return best
    if (!best || item.href.length > best.href.length) return item
    return best
  }, null)

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item === activeItem
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
import type { LucideIcon } from 'lucide-react'

const sizeMap = {
  sm: { wrapper: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { wrapper: 'h-12 w-12', icon: 'h-5 w-5' },
} as const

export function IconTile({
  icon: Icon,
  size = 'md',
  className = '',
}: {
  icon: LucideIcon
  size?: keyof typeof sizeMap
  className?: string
}) {
  const s = sizeMap[size]
  return (
    <div className={`flex ${s.wrapper} shrink-0 items-center justify-center rounded-full bg-foreground text-background ${className}`}>
      <Icon className={s.icon} />
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

export function IconInput({
  icon: Icon,
  className = '',
  ...props
}: { icon: LucideIcon } & ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={`pl-9 ${className}`} {...props} />
    </div>
  )
}
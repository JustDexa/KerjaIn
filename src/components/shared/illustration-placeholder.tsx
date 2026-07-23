import type { LucideIcon } from 'lucide-react'

export function IllustrationPlaceholder({
  icon: Icon,
  label,
  className = '',
  imageSrc,
  imageAlt,
}: {
  icon: LucideIcon
  label: string
  className?: string
  imageSrc?: string
  imageAlt?: string
}) {
  if (imageSrc) {
    return (
      <div className={`overflow-hidden rounded-xl ring-1 ring-foreground/10 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt ?? label} className="aspect-square w-full object-cover" />
      </div>
    )
  }

  return (
    <div className={`flex aspect-square items-center justify-center rounded-xl border bg-muted/30 ${className}`}>
      <div className="text-center text-muted-foreground">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border bg-background">
          <Icon className="h-7 w-7" />
        </div>
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}
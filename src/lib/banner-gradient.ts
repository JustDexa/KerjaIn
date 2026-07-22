export function getDefaultBannerClass(seed: string) {
  const gradients = [
    'from-neutral-200 via-neutral-100 to-neutral-300',
    'from-stone-200 via-stone-100 to-stone-300',
    'from-zinc-200 via-zinc-100 to-zinc-300',
    'from-neutral-300 via-neutral-200 to-neutral-100',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}
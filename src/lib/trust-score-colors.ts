export function trustScoreBadgeClass(score: number) {
  if (score >= 75) return 'bg-success text-success-foreground'
  if (score >= 40) return 'bg-rating text-foreground'
  return 'bg-destructive text-white'
}
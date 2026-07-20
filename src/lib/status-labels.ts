export function jobStatusLabel(status: string) {
  const map: Record<string, string> = {
    open: 'Terbuka',
    has_candidates: 'Ada Pelamar',
    deal: 'Deal',
    completed: 'Selesai',
    closed: 'Ditutup',
  }
  return map[status] ?? status
}

export function applicationStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Menunggu',
    accepted: 'Diterima',
    rejected: 'Ditolak',
  }
  return map[status] ?? status
}
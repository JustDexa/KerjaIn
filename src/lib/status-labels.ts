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

export function paymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Belum Bayar',
    dp_paid: 'DP Terbayar',
    paid: 'Lunas',
    refunded: 'Direfund',
  }
  return map[status] ?? status
}

export function transactionStatusLabel(status: string) {
  const map: Record<string, string> = {
    scheduled: 'Terjadwal',
    in_progress: 'Sedang Berjalan',
    waiting_payment: 'Menunggu Pembayaran',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  }
  return map[status] ?? status
}
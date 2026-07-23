import {
  ShieldCheck, ListChecks, Lock,
  Wrench, Car, UtensilsCrossed, PartyPopper,
  MessageSquareText, Sparkles, ClipboardCheck, Handshake,
} from 'lucide-react'

export const categoryIcons: Record<string, typeof Wrench> = {
  'Home Service': Wrench,
  'Otomotif': Car,
  'Food and Catering': UtensilsCrossed,
  'Tempat Sewa / Event Organizer': PartyPopper,
}

export const categoryDescriptions: Record<string, string> = {
  'Home Service': 'Servis rumah, reparasi, dan kebersihan',
  'Otomotif': 'Servis kendaraan dan tambal ban',
  'Food and Catering': 'Katering dan makanan siap saji',
  'Tempat Sewa / Event Organizer': 'Sewa tenda, sound system, dan dekorasi acara',
}

export const whyKerjaIn = [
  {
    icon: ShieldCheck,
    title: 'Trust Score Terverifikasi',
    description: 'Reputasi UMKM dibangun otomatis dari histori transaksi nyata, bukan klaim sepihak.',
  },
  {
    icon: ListChecks,
    title: 'Rekomendasi AI yang Transparan',
    description: 'Setiap rekomendasi disertai alasan eksplisit — bukan kotak hitam.',
  },
  {
    icon: Lock,
    title: 'Transaksi Aman',
    description: 'Chat, deal, dan pembayaran tercatat rapi dalam satu alur yang jelas.',
  },
]

export const matchingSteps = [
  { icon: MessageSquareText, text: 'Ceritakan kebutuhan kamu dengan bahasa natural' },
  { icon: Sparkles, text: 'AI mencari & merekomendasikan UMKM yang cocok' },
  { icon: ClipboardCheck, text: 'Tinjau rekomendasi beserta alasannya' },
  { icon: Handshake, text: 'Chat langsung dan lanjut ke kesepakatan' },
]

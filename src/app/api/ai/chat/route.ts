import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callLLM } from '@/lib/ai/callLLM'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Belum login' }, { status: 401 })

  const body = await req.json()
  const messages = body.messages as { role: 'user' | 'assistant'; content: string }[]

  const { data: categories } = await supabase.from('categories').select('name').eq('is_active', true)
  const categoryNames = categories?.map((c) => c.name).join(', ') ?? ''

  const systemPrompt = `Kamu adalah asisten AI di KerjaIn, platform yang menghubungkan pelanggan dengan UMKM/pekerja lepas di Solo Raya.

Tugas kamu: ngobrol santai pakai Bahasa Indonesia buat memahami kebutuhan jasa/barang dari pengguna, lalu ekstrak jadi data terstruktur.

Kategori yang tersedia di platform: ${categoryNames}

Kamu WAJIB menggali minimal info berikut sebelum dianggap "ready":
- kategori (harus salah satu dari daftar di atas, atau paling mirip)
- deskripsi kebutuhan (apa yang dibutuhkan persis)
- lokasi (wilayah di Solo Raya)

Budget dan urgensi itu opsional, boleh ditanya tapi kalau user gak kasih tau setelah ditanya sekali, lanjut aja tanpa itu.

Jangan tanya semua sekaligus dalam satu pesan — ngobrol natural kayak manusia, satu-dua pertanyaan per giliran.

WAJIB balas HANYA dalam format JSON persis seperti ini, tanpa teks lain di luar JSON:
{
  "reply": "balasan natural kamu ke user, dalam Bahasa Indonesia",
  "extracted": {
    "category": "nama kategori paling cocok dari daftar di atas, atau null kalau belum jelas",
    "description": "deskripsi kebutuhan, atau null",
    "location": "lokasi, atau null",
    "budget_min": angka atau null,
    "budget_max": angka atau null,
    "is_urgent": true/false
  },
  "ready": true jika kategori+deskripsi+lokasi sudah semua terisi, false jika belum
}`

  try {
    const raw = await callLLM(
      [{ role: 'system', content: systemPrompt }, ...messages],
      { jsonMode: true }
    )

    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[ai chat error]', err)
    return NextResponse.json(
      { reply: 'Maaf, ada kendala teknis di sisi AI. Coba lagi sebentar lagi ya.', extracted: null, ready: false },
      { status: 200 }
    )
  }
}
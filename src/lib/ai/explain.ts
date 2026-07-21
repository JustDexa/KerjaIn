import { callLLM } from './callLLM'
import type { MatchCandidate } from './matching'

export async function generateExplanations(
  requirement: { category: string | null; description: string | null; location: string | null },
  candidates: MatchCandidate[]
) {
  if (candidates.length === 0) return []

  const prompt = `Kamu asisten AI KerjaIn. User butuh: "${requirement.description}" di ${requirement.location}, kategori ${requirement.category}.

Berikut daftar kandidat UMKM yang sudah diranking sistem (skor 0-100, makin tinggi makin cocok). Untuk SETIAP kandidat, tulis 1 kalimat alasan rekomendasi yang natural dan spesifik dalam Bahasa Indonesia, based on data yang tersedia (jangan mengarang data yang gak ada).

Kandidat:
${candidates.map((c, i) => `${i + 1}. ${c.businessName} — skor ${c.score}, trust score ${c.trustScore}/100, wilayah ${c.serviceArea}, listing: ${c.matchedListingTitle ?? 'belum ada listing spesifik'}${c.matchedPrice ? `, harga Rp${c.matchedPrice}` : ''}`).join('\n')}

WAJIB balas HANYA JSON array seperti ini, urutan harus sama persis dengan daftar di atas, tanpa teks lain:
[{"reason": "alasan kandidat 1"}, {"reason": "alasan kandidat 2"}, ...]`

  try {
    const raw = await callLLM([{ role: 'user', content: prompt }], { jsonMode: true })
    const parsed = JSON.parse(raw)
    const reasons = Array.isArray(parsed) ? parsed : parsed.recommendations ?? parsed.results ?? []
    return candidates.map((c, i) => ({ ...c, reason: reasons[i]?.reason ?? `Cocok berdasarkan kategori dan skor kecocokan ${c.score}/100.` }))
  } catch (err) {
    console.error('[explain error]', err)
    // fallback: kalau LLM gagal, tetep tampilin kandidat dengan alasan generik
    return candidates.map((c) => ({ ...c, reason: `Direkomendasikan dengan skor kecocokan ${c.score}/100, trust score ${c.trustScore}/100.` }))
  }
}
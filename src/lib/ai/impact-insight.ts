import { callLLM } from './callLLM'

type ImpactMetrics = {
  totalValue: number
  completedJobs: number
  affectedUmkm: number
  avgTrustScore: number
  periodLabel: string
  categoryLabel: string
}

export async function generateImpactInsight(metrics: ImpactMetrics): Promise<string> {
  const prompt = `Kamu asisten AI buat Admin platform KerjaIn (marketplace UMKM & pekerja lepas Solo Raya, fokus SDG 8 - Decent Work).

Data dampak platform periode ${metrics.periodLabel}, kategori ${metrics.categoryLabel}:
- Nilai Ekonomi Terfasilitasi: Rp${metrics.totalValue.toLocaleString('id-ID')}
- Pekerjaan Terselesaikan: ${metrics.completedJobs}
- UMKM Terdampak: ${metrics.affectedUmkm}
- Rata-rata Trust Score Platform: ${metrics.avgTrustScore}/100

Tulis 2-3 kalimat insight dalam Bahasa Indonesia yang actionable buat Admin — soroti tren yang menonjol dan 1 rekomendasi tindak lanjut konkret. Jangan mengarang angka yang gak ada di data.

WAJIB balas HANYA teks insight-nya langsung, tanpa format JSON, tanpa tanda kutip di awal/akhir.`

  try {
    const raw = await callLLM([{ role: 'user', content: prompt }])
    return raw.trim()
  } catch (err) {
    console.error('[impact insight error]', err)
    return `Nilai ekonomi terfasilitasi Rp${metrics.totalValue.toLocaleString('id-ID')} dari ${metrics.completedJobs} pekerjaan selesai, menjangkau ${metrics.affectedUmkm} UMKM.`
  }
}
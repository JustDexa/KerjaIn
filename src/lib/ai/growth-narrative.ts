import { callLLM } from './callLLM'
import type { GrowthData } from './growth-insight'

export async function generateGrowthNarrative(businessName: string, data: GrowthData) {
  const prompt = `Kamu asisten AI KerjaIn buat UMKM bernama "${businessName}". Berdasarkan data berikut, tulis insight singkat & actionable dalam Bahasa Indonesia yang membantu mereka berkembang:

- Pendapatan bulan ini: Rp${data.currentMonthRevenue.toLocaleString('id-ID')}
- Pendapatan bulan lalu: Rp${data.previousMonthRevenue.toLocaleString('id-ID')}
- Perubahan: ${data.revenueChangePercent}%
- Harga rata-rata listing mereka: Rp${data.avgPriceThisUmkm.toLocaleString('id-ID')}
- Harga rata-rata di wilayah yang sama: Rp${data.avgPriceRegion.toLocaleString('id-ID')}
- Kategori paling laku: ${data.busiestCategory ?? 'belum ada data'}
- Total pekerjaan selesai: ${data.totalCompletedJobs}
- Kelengkapan profil: ${data.profileCompleteness.percent}%

WAJIB balas HANYA JSON seperti ini, tanpa teks lain:
{
  "revenueInsight": "1-2 kalimat soal tren pendapatan",
  "priceInsight": "1-2 kalimat soal posisi harga dibanding rata-rata wilayah",
  "profileInsight": "1-2 kalimat saran soal kelengkapan profil, kalau udah 100% kasih apresiasi singkat aja"
}`

  try {
    const raw = await callLLM([{ role: 'user', content: prompt }], { jsonMode: true })
    return JSON.parse(raw) as { revenueInsight: string; priceInsight: string; profileInsight: string }
  } catch (err) {
    console.error('[growth narrative error]', err)
    return {
      revenueInsight: `Pendapatan bulan ini Rp${data.currentMonthRevenue.toLocaleString('id-ID')}, ${data.revenueChangePercent >= 0 ? 'naik' : 'turun'} ${Math.abs(data.revenueChangePercent)}% dari bulan lalu.`,
      priceInsight: `Harga rata-rata listing kamu Rp${data.avgPriceThisUmkm.toLocaleString('id-ID')}, dibanding rata-rata wilayah Rp${data.avgPriceRegion.toLocaleString('id-ID')}.`,
      profileInsight: `Kelengkapan profil kamu ${data.profileCompleteness.percent}%.`,
    }
  }
}
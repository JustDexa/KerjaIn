'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateTrustScore } from '@/lib/trust-score'
import { createAdminClient } from '../supabase/admin'

const DUMMY_UMKM = [
  {
    email: 'dummy.bengkel@kerjain.test',
    fullName: 'Pak Joko',
    businessName: 'Bengkel Motor Pak Joko',
    description: 'Bengkel motor umum, spesialis servis rutin & ganti oli. Melayani area Solo dan sekitarnya.',
    serviceArea: 'Solo',
    offeringType: 'jasa',
    basePriceRange: 'Rp30.000 - Rp150.000',
    category: 'Otomotif',
    listings: [
      { title: 'Servis Rutin Motor', description: 'Servis lengkap + ganti oli', price: 75000, priceUnit: '/servis', type: 'jasa', transactionType: 'one_time' },
      { title: 'Tambal Ban', description: 'Tambal ban dalam & luar', price: 15000, priceUnit: '/ban', type: 'jasa', transactionType: 'one_time' },
    ],
  },
  {
    email: 'dummy.catering@kerjain.test',
    fullName: 'Bu Sari',
    businessName: 'Dapur Nusantara Catering',
    description: 'Catering rumahan untuk acara keluarga, arisan, hingga hajatan. Menu bisa custom sesuai selera.',
    serviceArea: 'Sukoharjo',
    offeringType: 'barang',
    basePriceRange: 'Rp15.000 - Rp35.000/porsi',
    category: 'Food and Catering',
    listings: [
      { title: 'Paket Nasi Box', description: 'Nasi box lengkap dengan lauk pilihan', price: 20000, priceUnit: '/box', type: 'barang', transactionType: 'one_time' },
      { title: 'Catering Hajatan', description: 'Paket catering untuk 100-500 porsi', price: 18000, priceUnit: '/porsi', type: 'barang', transactionType: 'project' },
    ],
  },
  {
    email: 'dummy.bersih@kerjain.test',
    fullName: 'Mbak Ratna',
    businessName: 'Jasa Bersih Mandiri',
    description: 'Jasa cleaning service rumah & kantor, berpengalaman lebih dari 5 tahun.',
    serviceArea: 'Karanganyar',
    offeringType: 'jasa',
    basePriceRange: 'Rp50.000 - Rp200.000',
    category: 'Home Service',
    listings: [
      { title: 'Bersih Rumah Harian', description: 'Cleaning rumah 2-3 jam', price: 60000, priceUnit: '/kunjungan', type: 'jasa', transactionType: 'one_time' },
      { title: 'Deep Cleaning', description: 'Bersih menyeluruh termasuk kamar mandi & dapur', price: 150000, priceUnit: '/sesi', type: 'jasa', transactionType: 'one_time' },
    ],
  },
  {
    email: 'dummy.eo@kerjain.test',
    fullName: 'Mas Dimas',
    businessName: 'CV Bangun Sejahtera EO',
    description: 'Penyedia sewa tenda, sound system, dan dekorasi untuk berbagai acara.',
    serviceArea: 'Solo',
    offeringType: 'keduanya',
    basePriceRange: 'Rp200.000 - Rp2.000.000',
    category: 'Tempat Sewa / Event Organizer',
    listings: [
      { title: 'Sewa Tenda + Kursi', description: 'Paket tenda untuk 100 tamu', price: 800000, priceUnit: '/hari', type: 'barang', transactionType: 'rental' },
      { title: 'Sound System Standar', description: 'Sound system untuk acara indoor/outdoor', price: 350000, priceUnit: '/hari', type: 'barang', transactionType: 'rental' },
    ],
  },
]

const DUMMY_CUSTOMERS = [
  { email: 'dummy.andi@kerjain.test', fullName: 'Andi Wijaya' },
  { email: 'dummy.rina@kerjain.test', fullName: 'Rina Kusuma' },
  { email: 'dummy.bagus@kerjain.test', fullName: 'Bagus Prasetyo' },
]

const REVIEW_COMMENTS = [
  'Pelayanan cepat dan ramah, hasilnya memuaskan!',
  'Sesuai ekspektasi, harga juga wajar. Recommended.',
  'Responnya cepat, kerjaannya rapi. Bakal order lagi.',
  'Cukup baik, ada sedikit keterlambatan tapi hasil akhirnya oke.',
]

export async function seedDummyData() {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Seed cuma boleh jalan di development' }
  }

  const adminClient = createAdminClient()
  const supabase = await createClient()
  const log: string[] = []

  const { data: categories } = await supabase.from('categories').select('id, name')
  const categoryMap = new Map((categories ?? []).map((c) => [c.name, c.id]))

  // 1. Bikin akun customer dummy (pakai admin API biar gak perlu email confirm)
  const customerIds: string[] = []
  for (const cust of DUMMY_CUSTOMERS) {
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', cust.email).maybeSingle()
    if (existingUser) {
      customerIds.push(existingUser.id)
      continue
    }

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: cust.email,
      password: 'DummyPass123!',
      email_confirm: true,
      user_metadata: { full_name: cust.fullName, role: 'user' },
    })

    if (authError || !authUser.user) {
      log.push(`Gagal bikin customer ${cust.email}: ${authError?.message}`)
      continue
    }
    customerIds.push(authUser.user.id)
  }

  // 2. Bikin akun UMKM dummy + profil + katalog
  const umkmIds: string[] = []
  for (const umkm of DUMMY_UMKM) {
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', umkm.email).maybeSingle()
    let umkmId: string

    if (existingUser) {
      umkmId = existingUser.id
    } else {
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: umkm.email,
        password: 'DummyPass123!',
        email_confirm: true,
        user_metadata: { full_name: umkm.fullName, role: 'umkm' },
      })

      if (authError || !authUser.user) {
        log.push(`Gagal bikin UMKM ${umkm.email}: ${authError?.message}`)
        continue
      }
      umkmId = authUser.user.id

      await supabase.from('umkm_profiles').insert({
        user_id: umkmId,
        business_name: umkm.businessName,
        description: umkm.description,
        offering_type: umkm.offeringType,
        service_area: umkm.serviceArea,
        base_price_range: umkm.basePriceRange,
      })

      const categoryId = categoryMap.get(umkm.category)
      if (categoryId) {
        await supabase.from('umkm_categories').insert({ umkm_id: umkmId, category_id: categoryId })
      }

      for (const listing of umkm.listings) {
        await supabase.from('listings').insert({
          umkm_id: umkmId,
          type: listing.type,
          transaction_type: listing.transactionType,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          price_unit: listing.priceUnit,
        })
      }
    }
    umkmIds.push(umkmId)
  }

  log.push(`${customerIds.length} customer, ${umkmIds.length} UMKM siap.`)

  // 3. Bikin job + transaksi + review dummy (biar Trust Score & Growth Dashboard keisi)
  let transactionCount = 0
  for (let i = 0; i < umkmIds.length; i++) {
    const umkmId = umkmIds[i]
    const umkmMeta = DUMMY_UMKM[i]
    const categoryId = categoryMap.get(umkmMeta.category)

    // 3 job per UMKM, masing-masing beda customer, biar ada variasi repeat/non-repeat
    for (let j = 0; j < 3; j++) {
      const customerId = customerIds[j % customerIds.length]
      const listing = umkmMeta.listings[j % umkmMeta.listings.length]

      const { data: job } = await supabase.from('job_postings').insert({
        user_id: customerId,
        category_id: categoryId,
        description: `${listing.title} — kebutuhan dummy #${j + 1}`,
        location: umkmMeta.serviceArea,
        budget_min: listing.price,
        budget_max: listing.price,
        status: 'completed',
        source: 'manual',
      }).select('id').single()

      if (!job) continue

      await supabase.from('job_applications').insert({
        job_posting_id: job.id,
        umkm_id: umkmId,
        comment: 'Siap mengerjakan, pengalaman di bidang ini.',
        status: 'accepted',
      })

      const completedDate = new Date()
      completedDate.setDate(completedDate.getDate() - (j * 10 + 2))

      const { data: transaction } = await supabase.from('transactions').insert({
        job_posting_id: job.id,
        user_id: customerId,
        umkm_id: umkmId,
        transaction_type: listing.transactionType,
        status: 'completed',
        payment_status: 'paid',
        total_amount: listing.price,
        completed_at: completedDate.toISOString(),
        created_at: completedDate.toISOString(),
      }).select('id').single()

      if (!transaction) continue

      const rating = 4 + (j % 2) // variasi rating 4-5
      const { data: review } = await supabase.from('reviews').insert({
        transaction_id: transaction.id,
        user_id: customerId,
        umkm_id: umkmId,
        rating,
        comment: REVIEW_COMMENTS[(i + j) % REVIEW_COMMENTS.length],
      }).select('id').single()

      if (review) {
        await supabase.from('portfolio_entries').insert({
          umkm_id: umkmId,
          transaction_id: transaction.id,
          review_id: review.id,
          comment: REVIEW_COMMENTS[(i + j) % REVIEW_COMMENTS.length],
          category: umkmMeta.category,
          date: completedDate.toISOString(),
        })
      }

      transactionCount++
    }

    // hitung ulang trust score beneran (pakai fungsi yang sama kayak Fase 6)
    const result = await calculateTrustScore(umkmId)
    await supabase.from('umkm_profiles').update({ trust_score: result.total }).eq('user_id', umkmId)
    await supabase.from('trust_score_logs').insert({
      umkm_id: umkmId,
      change_amount: result.total,
      new_score: result.total,
      source_type: 'review',
    })
  }

  log.push(`${transactionCount} transaksi + review dummy dibuat, trust score dihitung ulang.`)

  return { success: true, log }
}
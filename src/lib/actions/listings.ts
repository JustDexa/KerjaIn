'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadFiles } from '@/lib/supabase/upload'
import { revalidatePath } from 'next/cache'

export async function addListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi habis, silakan login kembali.' }
  }

  // Tarik data dasar
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string // 'barang' | 'jasa' | 'custom_request'
  const transactionType = formData.get('transactionType') as string // 'one_time' | 'project' | 'subscription' | 'rental'
  const price = parseFloat(formData.get('price') as string)
  const priceUnit = formData.get('priceUnit') as string

  // Tarik semua file foto (bisa lebih dari satu)
  const files = formData.getAll('photos') as File[]
  const validFiles = files.filter(file => file.size > 0)

  let photoUrls: string[] = []

  if (validFiles.length > 0) {
    const timestamp = Date.now()
    
    // KOREKSI DI SINI: Masukkan 'supabase' sebagai argumen pertama
    const { urls, error: uploadError } = await uploadFiles(
      supabase, // <--- Ini yang tadi ketinggalan
      validFiles,
      'public-photos',
      `listings/${user.id}/${timestamp}`
    )

    if (uploadError) {
      return { error: `Gagal upload foto: ${uploadError}` }
    }
    photoUrls = urls
  }

  // Insert ke database sesuai skema
  const { error: dbError } = await supabase
    .from('listings')
    .insert({
      umkm_id: user.id, // ID UMKM sama dengan ID User
      title,
      description,
      type,
      transaction_type: transactionType,
      price: isNaN(price) ? null : price,
      price_unit: priceUnit,
      photos: photoUrls, // PostgreSQL menerima array of strings langsung!
      status: 'active'
    })

  if (dbError) {
    return { error: `Gagal menyimpan listing: ${dbError.message}` }
  }

  // Refresh path katalog UMKM biar langsung muncul
  revalidatePath('/umkm/catalog')
  
  return { success: true }
}

export async function deleteListing(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sesi habis, silakan login kembali.' }
  }

  // Hapus listing berdasarkan ID, tapi pastikan umkm_id cocok dengan user 
  // biar orang lain nggak bisa asal hapus data UMKM lain
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('umkm_id', user.id)

  if (error) {
    return { error: `Gagal menghapus listing: ${error.message}` }
  }

  // Refresh path katalog biar item langsung hilang dari UI
  revalidatePath('/umkm/catalog')
  
  return { success: true }
}
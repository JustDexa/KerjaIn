import { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export type UploadResult = {
  urls: string[]
  error?: string
}

function extFromType(type: string) {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
}

function validateFiles(files: File[]): string | null {
  for (const f of files) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return `Format ${f.name} tidak didukung (jpg/png/webp saja)`
    }
    if (f.size > MAX_SIZE) {
      return `${f.name} melebihi 5MB`
    }
  }
  return null
}

export async function uploadFiles(
  supabase: SupabaseClient, 
  files: File[],
  bucket: 'public-photos' | 'verification-docs',
  pathPrefix: string
): Promise<UploadResult> {
  if (files.length === 0) return { urls: [] }

  const invalidMsg = validateFiles(files)
  if (invalidMsg) return { urls: [], error: invalidMsg }

  const uploaded: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const path = `${pathPrefix}/${Date.now()}-${i}.${extFromType(file.type)}`

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) return { urls: uploaded, error: error.message }

    if (bucket === 'public-photos') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      uploaded.push(data.publicUrl)
    } else {
      uploaded.push(path)
    }
  }

  return { urls: uploaded }
}
import { createClient } from '@/lib/supabase/server'
import { OnboardingUmkmForm } from '@/components/shared/onboarding-umkm-form'

export default async function OnboardingUmkmPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Lengkapi Profil UMKM</h1>
        <OnboardingUmkmForm categories={categories ?? []} />
      </div>
    </div>
  )
}
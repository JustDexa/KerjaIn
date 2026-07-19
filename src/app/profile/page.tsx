import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/shared/edit-profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('full_name, phone, role')
    .eq('id', user!.id)
    .single()

  let umkmData = null
  if (userData?.role === 'umkm') {
    const { data } = await supabase
      .from('umkm_profiles')
      .select('business_name, description, service_area, offering_type, base_price_range, operational_hours')
      .eq('user_id', user!.id)
      .single()
    umkmData = data
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Profil Saya</h1>
      <EditProfileForm role={userData!.role} userData={userData!} umkmData={umkmData} />
    </div>
  )
}
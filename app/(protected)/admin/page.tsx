import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/dashboard/admin-dashboard'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  // Middleware has already verified admin access
  // Safely fetch profile data using standard client (now has RLS policy for admins)
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()
  
  return (
    <AdminDashboard 
      user={{ 
        email: user!.email!, 
        displayName: profile?.display_name 
      }} 
    />
  )
}
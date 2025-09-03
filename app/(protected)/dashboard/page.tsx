import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserDashboard } from '@/components/user/dashboard/user-dashboard'

export default async function UserDashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()
  
  return (
    <UserDashboard
      user={{
        id: user.id,
        email: user.email!,
        displayName: profile?.display_name
      }}
    />
  )
}
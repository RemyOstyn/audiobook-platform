import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.display_name || user.email}
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Total Audiobooks</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Processing</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Active</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl font-bold">1</p>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          Phase 2 implementation in progress. Full admin features coming soon.
        </p>
      </div>
    </div>
  )
}
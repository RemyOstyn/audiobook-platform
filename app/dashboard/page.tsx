import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UserDashboard() {
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
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Library</h1>
        <p className="text-muted-foreground">
          Welcome, {profile?.display_name || user.email}
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Your Audiobook Library</h3>
          <p className="text-muted-foreground mb-4">
            You don't have any audiobooks yet.
          </p>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Browse the catalog to purchase audiobooks and start building your library!
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          User features will be implemented in future phases.
        </p>
      </div>
    </div>
  )
}
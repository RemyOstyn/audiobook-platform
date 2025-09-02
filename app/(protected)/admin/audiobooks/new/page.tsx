import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadPageClient } from './upload-page-client'

export default async function NewAudiobookPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Audiobook</h1>
        <p className="text-muted-foreground">
          Add a new audiobook to your platform
        </p>
      </div>

      <UploadPageClient />
    </div>
  )
}
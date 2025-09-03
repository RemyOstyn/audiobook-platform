import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditAudiobookClient } from './edit-audiobook-client'

interface EditAudiobookPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAudiobookPage({ params }: EditAudiobookPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Check authentication and admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch the audiobook
  const { data: audiobook, error } = await supabase
    .from('audiobooks')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !audiobook) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Audiobook</h1>
          <p className="text-muted-foreground">
            Update audiobook information and cover image
          </p>
        </div>
      </div>

      <EditAudiobookClient audiobook={audiobook} />
    </div>
  )
}
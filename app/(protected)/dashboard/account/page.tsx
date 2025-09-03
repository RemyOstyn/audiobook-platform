import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default async function AccountPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, role, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider">Email</Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs font-medium uppercase tracking-wider">Display Name</Label>
              <Input 
                id="displayName" 
                placeholder="Enter your display name"
                defaultValue={profile?.display_name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider">Account Type</Label>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'} className="w-fit">
                {profile?.role === 'admin' ? 'Administrator' : 'User'}
              </Badge>
            </div>
            <div className="pt-2">
              <Button size="sm" className="w-full">Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account Overview</CardTitle>
            <CardDescription>Your account statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm font-medium">Member Since</span>
              <span className="text-sm text-muted-foreground">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm font-medium">Audiobooks Owned</span>
              <span className="text-sm text-muted-foreground">0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm font-medium">Total Spent</span>
              <span className="text-sm text-muted-foreground">$0.00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Account Status</span>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Security Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Button variant="outline" size="sm">
              Change Password
            </Button>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates about your purchases</p>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Download Quality</p>
              <p className="text-xs text-muted-foreground">Choose audio quality for downloads</p>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
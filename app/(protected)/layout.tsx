import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  // Get user profile for role-based navigation
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        user={{
          email: user.email!,
          displayName: profile?.display_name
        }}
        userRole={profile?.role}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar for mobile */}
        <div className="md:hidden h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-16">
            <h1 className="font-semibold">
              {profile?.role === 'admin' ? 'Admin Panel' : 'AudioBook Platform'}
            </h1>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
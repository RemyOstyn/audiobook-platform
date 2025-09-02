import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userProfile = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single()
    userProfile = profile
  }

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href="/">AudioBook Platform</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <UserMenu 
                user={{
                  email: user.email!,
                  displayName: userProfile?.display_name
                }}
                userRole={userProfile?.role}
              />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto p-5">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Premium Audiobooks Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Discover, purchase, and enjoy high-quality audiobooks from your favorite authors.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
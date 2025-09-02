import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Premium Audiobook Destination
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover, purchase, and enjoy high-quality audiobooks from your favorite authors. 
              Professional narration meets cutting-edge technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                userProfile?.role === 'admin' ? (
                  <>
                    <Link href="/admin">
                      <Button size="lg" className="w-full sm:w-auto">Admin Dashboard</Button>
                    </Link>
                    <Link href="/browse">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">Manage Library</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard">
                      <Button size="lg" className="w-full sm:w-auto">My Library</Button>
                    </Link>
                    <Link href="/browse">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">Browse Audiobooks</Button>
                    </Link>
                  </>
                )
              ) : (
                <>
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="w-full sm:w-auto">Get Started</Button>
                  </Link>
                  <Link href="/browse">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">Browse Library</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
              <p className="text-lg text-muted-foreground">
                Experience audiobooks like never before with our premium features
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl mb-4">📚</div>
                  <CardTitle>Vast Library</CardTitle>
                  <CardDescription>
                    Thousands of premium audiobooks across all genres and categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    From bestsellers to hidden gems, find your next favorite listen in our carefully curated collection.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl mb-4">🎧</div>
                  <CardTitle>High Quality</CardTitle>
                  <CardDescription>
                    Professional narration with crystal-clear audio production
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enjoy studio-quality recordings narrated by talented voice actors and authors themselves.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl mb-4">💾</div>
                  <CardTitle>Instant Access</CardTitle>
                  <CardDescription>
                    Download or stream anywhere, anytime on any device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access your library instantly after purchase. Listen offline or stream on-the-go.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Get started in just three simple steps
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your free account in seconds with email or Google OAuth
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse & Purchase</h3>
                <p className="text-muted-foreground">
                  Discover audiobooks and purchase with our secure, simple checkout
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Listen Anywhere</h3>
                <p className="text-muted-foreground">
                  Stream instantly or download for offline listening on any device
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background py-8 px-4 mt-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <p className="text-sm text-muted-foreground">
                © 2025 AudioBook Platform. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
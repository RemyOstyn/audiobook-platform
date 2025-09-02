# Phase 1: Foundation Setup

**Goal**: Basic setup and authentication  
**Timeline**: Day 1 (4-5 hours with boilerplate)  
**Status**: ✅ COMPLETED

## Prerequisites

- Node.js 20+ and npm 10+
- Git configured
- Supabase account (supabase.com)
- Google Cloud Console access (for OAuth)

## Step 1: Project Initialization

### Option A: Official Supabase Template (Recommended)
```bash
npx create-next-app@latest audiobook-platform -e with-supabase
cd audiobook-platform
```

### Option B: Manual Next.js + Supabase Setup
```bash
npx create-next-app@latest audiobook-platform --typescript --tailwind --app
cd audiobook-platform
npm install @supabase/supabase-js @supabase/ssr
```

**Recommendation**: Use Option A - saves 2-3 hours and includes production-ready patterns.

## Step 2: Supabase Project Setup

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and set project details:
   - Name: `audiobook-platform`
   - Database Password: (generate strong password)
   - Region: Choose closest to your users

### Configure Authentication
1. Go to Authentication → Settings
2. Enable providers:
   - Email (enabled by default)
   - Google OAuth:
     - Get credentials from Google Cloud Console
     - Add authorized redirect: `https://your-project.supabase.co/auth/v1/callback`
3. Configure email templates (optional for MVP)

### Environment Variables
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (for Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 3: Database Schema Setup

### Install Prisma
```bash
npm install -D prisma
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

### Create Database Schema
Replace `prisma/schema.prisma` with the complete schema from the PRD (see `/docs/database/schema.prisma`).

### Run Migrations
```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase (for development)
npx prisma db push

# Or create and run migrations (for production)
npx prisma migrate dev --name init
```

## Step 4: Enhanced Dependencies

### Install Required Packages
```bash
# State management
npm install zustand

# Form handling
npm install zod react-hook-form @hookform/resolvers

# UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card form input toast dialog

# Icons
npm install lucide-react

# Date handling
npm install date-fns
```

### Development Dependencies
```bash
npm install -D @types/node eslint-config-next
```

## Step 5: Project Structure

### Create Directory Structure
```
audiobook-platform/
├── docs/
│   ├── phases/
│   ├── database/
│   └── api/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── reset-password/
│   │   ├── (public)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   └── library/
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── audiobooks/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── audiobooks/
│   │   │   └── upload/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── auth/
│   │   ├── layout/
│   │   └── admin/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── store/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── public/
```

## Step 6: Core Configuration Files

### TypeScript Configuration
Ensure `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind Configuration
Update `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... shadcn color system
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

## Step 7: Authentication Implementation

### Supabase Client Setup
Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server-side Client
Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )
}
```

### Middleware for Route Protection
Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check auth for protected routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Step 8: Initial Database Seed

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Create admin user
  const { data: adminAuth } = await supabase.auth.admin.createUser({
    email: 'admin@audiobook-platform.com',
    password: 'admin123456',
    email_confirm: true,
  })

  if (adminAuth.user) {
    await prisma.profile.create({
      data: {
        id: adminAuth.user.id,
        role: 'admin',
        display_name: 'Admin User',
      },
    })
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:
```json
{
  "scripts": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Step 9: Testing the Setup

### Run the Application
```bash
npm run dev
```

### Test Checklist
- [x] Application runs on http://localhost:3000
- [x] Can access login page
- [x] Can register new user
- [x] Can login with email/password
- [x] Can access protected routes after login
- [x] Admin routes redirect non-admin users
- [x] Database connection works
- [ ] Google OAuth configured (if enabled)

## Success Criteria

✅ **Authentication Working**: Users can register, login, and logout  
✅ **Route Protection**: Protected routes require authentication  
✅ **Role-Based Access**: Admin routes check user roles  
✅ **Database Connected**: Prisma client connects to Supabase  
✅ **Session Management**: Sessions persist across browser refreshes  
✅ **TypeScript**: Full type safety throughout the application  
✅ **UI Components**: shadcn/ui components installed and configured  

## Next Steps

After completing Phase 1:
1. ✅ Review `/docs/phases/phase-2-admin-core.md`
2. ✅ Test all authentication flows thoroughly
3. ✅ Verify database schema matches requirements
4. ✅ Confirm environment variables are properly set

## Phase 1 Completion Summary

**✅ Completed Items:**
- Project initialization with Next.js 15 + Supabase template
- Supabase project setup with PostgreSQL database
- Database schema implementation (9 tables, 5 enums)
- Environment variables configuration
- Prisma ORM setup with migrations
- Authentication system (login, signup, forgot-password)
- Route protection middleware
- shadcn/ui components installation
- Project cleanup (removed boilerplate)
- ESLint configuration for generated files
- Build and development environment testing

**Ready for Phase 2: Admin Core Implementation**

## Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure all `.env.local` variables are set
2. **Database Connection**: Check DATABASE_URL format
3. **Supabase Auth**: Verify project URL and anon key
4. **TypeScript Errors**: Run `npx prisma generate` after schema changes

### Getting Help
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://prisma.io/docs
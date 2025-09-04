# Production Deployment Guide

This guide will walk you through deploying the audiobook e-commerce platform to production with all required services.

## 📋 Prerequisites

- GitHub account with your audiobook platform repository
- Credit card for service sign-ups (most have free tiers)
- Domain name (optional, Vercel provides free domains)

---

## 🗃️ Step 1: Supabase Setup (Database & Authentication)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose your organization
4. Set project name: `audiobook-platform`
5. Set database password (save this!)
6. Choose region closest to your users
7. Click "Create new project" (takes 2-3 minutes)

### 1.2 Get Supabase Credentials
Once your project is ready:
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values for your `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...  # anon/public key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...      # service_role key (keep secret!)
   ```

### 1.3 Get Database Connection Strings
1. Go to **Settings** → **Database**
2. Scroll down to "Connection string"
3. Select "Nodejs" and copy:
   ```bash
   # Connection pooling (for app usage)
   DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Direct connection (for migrations)
   DIRECT_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```
   Replace `[PASSWORD]` with your database password from Step 1.1

### 1.4 Setup Authentication Providers
1. Go to **Authentication** → **Providers**
2. Enable **Google OAuth**:
   - Toggle "Enable Google provider" to ON
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client secret to Supabase
   - Click "Save"

### 1.5 Setup Storage
1. Go to **Storage** in Supabase dashboard
2. Create bucket: `audiobooks`
   - Public: NO (we'll use signed URLs)
   - File size limit: 500MB
   - Allowed MIME types: `audio/mpeg,audio/mp4,audio/x-m4a,audio/x-m4b,audio/aac`
3. Create bucket: `covers`
   - Public: YES
   - File size limit: 10MB  
   - Allowed MIME types: `image/jpeg,image/png,image/webp`

---

## 🤖 Step 2: OpenAI Setup (AI Processing)

### 2.1 Create OpenAI Account
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up with email or Google
3. Verify your phone number

### 2.2 Add Payment Method
⚠️ **Required**: OpenAI requires a payment method for API access
1. Go to **Settings** → **Billing**
2. Click "Add payment method"
3. Add credit card details
4. Set usage limit (recommended: $10-20 for demo/testing)

### 2.3 Generate API Key
1. Go to **API Keys** section
2. Click "Create new secret key"
3. Name it: `audiobook-platform`
4. Copy the key (starts with `sk-proj-`):
   ```bash
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```
   ⚠️ **Save this immediately** - you won't see it again!

### 2.4 Verify Access
Test your API key works:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-your-api-key"
```
You should see a list of available models.

---

## ⚡ Step 3: Inngest Setup (Background Jobs)

### 3.1 Create Inngest Account
1. Go to [inngest.com](https://inngest.com)
2. Sign up (GitHub login recommended)
3. Create new app:
   - Name: `audiobook-platform`
   - Choose your plan (free tier: 25K events/month)

### 3.2 Get Inngest Keys
1. In your Inngest dashboard, go to your app
2. Go to **Settings** → **Keys**
3. Copy these values:
   ```bash
   INNGEST_EVENT_KEY=evt_your_event_key_here
   INNGEST_SIGNING_KEY=signkey_test_your_signing_key_here
   ```

### 3.3 Configure Inngest (After Deployment)
You'll need to register your Inngest endpoint after deploying to Vercel:
1. Deploy your app first (Step 4)
2. Go back to Inngest dashboard
3. Go to **Settings** → **Events** → **Event Key**
4. Add your deployed URL: `https://your-app.vercel.app/api/inngest`

---

## 🚀 Step 4: Vercel Deployment

### 4.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your audiobook platform repository
4. Choose the repository and click "Import"

### 4.2 Configure Build Settings
Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

### 4.3 Add Environment Variables
Before deploying, add all environment variables:

1. In Vercel project settings, go to **Environment Variables**
2. Add each variable from your local `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
DATABASE_URL=postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-proj-your-api-key

# Inngest
INNGEST_EVENT_KEY=evt_your_event_key
INNGEST_SIGNING_KEY=signkey_test_your_signing_key

# App Settings
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

### 4.4 Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your app will be available at `https://your-app-name.vercel.app`

---

## 🔧 Step 5: Post-Deployment Setup

### 5.1 Run Database Migrations
From your local machine with the production environment variables:

```bash
# Temporarily set production DATABASE_URL in your local .env.local
# Then run:
npx prisma db push
```

Or use Vercel CLI:
```bash
npm install -g vercel
vercel env pull .env.production.local
npx prisma db push --preview-feature
```

### 5.2 Seed Initial Data
```bash
# Using the production database URL:
npm run seed
```

This creates:
- Sample audiobooks
- Admin user (check console output for credentials)
- Categories and test data

### 5.3 Configure Inngest Integration
1. Go back to your Inngest dashboard
2. Navigate to your app settings
3. Add webhook URL: `https://your-app.vercel.app/api/inngest`
4. Test the connection - you should see a green checkmark

### 5.4 Create Admin User
Either use the seeded admin user or create one manually:

1. Visit your deployed app: `https://your-app.vercel.app`
2. Sign up with email/password
3. Go to Supabase dashboard → **Table Editor** → `profiles`
4. Find your user and change `role` from `user` to `admin`
5. Refresh your app - you should now see "Admin" in the header

---

## ✅ Step 6: Testing Production Deployment

### 6.1 Test User Registration & Login
1. Visit your app
2. Sign up with a new email
3. Try Google OAuth login
4. Test password reset flow

### 6.2 Test Admin Functions
1. Login as admin user
2. Go to `/admin`
3. Try uploading a small audio file (< 5MB for quick testing)
4. Check processing status - it should show "Processing"
5. Wait for completion (1-2 minutes for small files)

### 6.3 Test E-commerce Flow
1. Browse audiobooks
2. Add items to cart
3. Complete checkout process
4. Check user library
5. Try downloading purchased content

### 6.4 Monitor Background Jobs
1. Go to Inngest dashboard
2. Check **Functions** tab - you should see your processing functions
3. Check **Events** tab for job execution logs
4. Any errors will show up here

---

## 🐛 Step 7: Troubleshooting

### Common Issues

**Build Fails on Vercel:**
```bash
# Check build logs in Vercel dashboard
# Common fix: ensure all dependencies are in package.json
npm install --save-dev @types/node
```

**Database Connection Error:**
- Verify DATABASE_URL format matches exactly
- Check password special characters are URL-encoded
- Ensure Supabase project is not paused (happens after inactivity)

**OpenAI API Error:**
- Verify API key is correct and starts with `sk-proj-`
- Check billing settings - you need a payment method
- Monitor usage limits in OpenAI dashboard

**Inngest Jobs Not Running:**
- Check webhook URL is registered correctly
- Verify signing key matches exactly
- Check function logs in Inngest dashboard

**File Upload Fails:**
- Check storage bucket permissions in Supabase
- Verify file size limits (500MB max)
- Check CORS settings if uploading from browser

### Monitoring Production

**Application Logs:**
- Vercel: Functions tab shows serverless function logs
- Supabase: Logs & Metrics section for database queries
- Inngest: Events tab for background job execution

**Performance Monitoring:**
- Vercel Analytics (free tier available)
- Supabase dashboard metrics
- OpenAI usage dashboard

**Error Tracking:**
Consider adding Sentry for production error tracking:
```bash
npm install @sentry/nextjs
```

---

## 💰 Cost Estimation

**Free Tiers (No cost):**
- Vercel: 100GB bandwidth, unlimited personal projects
- Supabase: 50MB database, 1GB bandwidth, 100MB storage
- Inngest: 25,000 events per month

**Paid Usage (for production):**
- OpenAI: ~$0.006/minute for Whisper + $0.01-0.03 per GPT-4 description
- Vercel Pro: $20/month for team features
- Supabase Pro: $25/month for increased limits

**Estimated monthly cost for moderate usage:** $10-50

---

## 🎯 Go Live Checklist

Before sharing your live demo:

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Admin user created and accessible
- [ ] Sample audiobook uploaded and processed successfully
- [ ] E-commerce flow tested end-to-end
- [ ] Inngest webhook connected and processing jobs
- [ ] Error pages working (try `/non-existent-page`)
- [ ] Mobile responsive design tested
- [ ] SSL certificate active (https://)

---

## 🔗 Quick Reference URLs

After deployment, bookmark these:
- **Your Live App**: `https://your-app-name.vercel.app`
- **Admin Panel**: `https://your-app-name.vercel.app/admin`
- **Supabase Dashboard**: `https://app.supabase.com/project/your-project-id`
- **Vercel Dashboard**: `https://vercel.com/your-username/your-app-name`
- **Inngest Dashboard**: `https://inngest.com/apps/your-app`
- **OpenAI Usage**: `https://platform.openai.com/usage`

---

## 🆘 Need Help?

If you encounter issues:
1. Check the Troubleshooting section above
2. Review logs in respective service dashboards
3. Verify all environment variables are set correctly
4. Test locally first if possible

Your audiobook platform should now be live and ready for demonstration! 🎉
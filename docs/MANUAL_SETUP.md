# Manual Setup Guide

This guide covers all the manual steps required to set up external services and configurations for the URL shortener project using Supabase, Vercel, and other cloud services.

## 1. Plausible Analytics Setup ✅

### Create Plausible Account ✅
1. Go to [plausible.io](https://plausible.io) and sign up for an account
2. Choose a subscription plan (they offer a 30-day free trial)

### Add Your Domain ✅
1. Once logged in, click "Add a new site"
2. Enter your domain: `url-shortener-eosin-eight.vercel.app`
3. Timezone: GMT-3
4. Installation method: Manual
5. For extra measurements, enable:
   - ✅ Custom events (for tracking redirects)
   - Optional: Outbound links, File downloads

### Installation Script ✅
- Script successfully installed in Next.js layout
- Plausible confirmed: "Your installation is working and visitors are being counted accurately"
- Domain: `url-shortener-eosin-eight.vercel.app`

### Get API Keys ℹ️ (Optional - Requires Paid Plan)
1. API keys require a paid Plausible plan
2. For free plan, we'll use JavaScript tracking on frontend
3. Events will be tracked when users visit shortened URLs

### Configure Goals 🔄 TODO
1. Go to your site settings in Plausible
2. Navigate to "Goals"
3. Add a custom event goal named `redirect`
4. This will help you track redirect events separately

## 2. Supabase Setup ✅

### Create Supabase Project ✅
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Name: "URL Shortener"
4. Database Password: `.a7Yu7ApHDnACWZ`
5. Region: US East 2

### Get Connection Details ✅
1. Project URL: `https://zczsddzwicqokspwktxj.supabase.co`
2. Database URLs:
   - **Pooled Connection**: `postgresql://postgres.zczsddzwicqokspwktxj:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct Connection**: `postgresql://postgres.zczsddzwicqokspwktxj:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres`
3. API Keys:
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenNkZHp3aWNxb2tzcHdrdHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODE3NjIsImV4cCI6MjA2NzU1Nzc2Mn0.T7A3i1SVJlASrgEZ7KGG1y_VY23Ds0tdi1mPcJwyZqs`
   - **Service Role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenNkZHp3aWNxb2tzcHdrdHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk4MTc2MiwiZXhwIjoyMDY3NTU3NzYyfQ.l_CldaBAiEOod3dCzf0E-2-NVcDwGPL3tXj-n4sBuWk`
   - **JWT Secret**: `SOLB7C4+L4IC6ZvP4qbiAJ0DQ5+Rq7b4uNuUTVT9338brWvMvgTNAjsefnIXMckeO6A0kTJfOLGS355iE36t6A==`

### Enable Row Level Security (RLS) ✅
✅ **Status**: RLS enabled and policies created successfully.

1. RLS enabled on `urls` table
2. Policies created:
   - Users can view/insert/update/delete their own URLs
   - Anonymous users can view any URL (for redirects)
```sql
-- Enable RLS
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own URLs
CREATE POLICY "Users can view own URLs" ON urls
  FOR SELECT USING (auth.uid() = user_id::uuid);

-- Policy: Users can insert their own URLs
CREATE POLICY "Users can insert own URLs" ON urls
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

-- Policy: Users can update their own URLs
CREATE POLICY "Users can update own URLs" ON urls
  FOR UPDATE USING (auth.uid() = user_id::uuid);

-- Policy: Users can delete their own URLs
CREATE POLICY "Users can delete own URLs" ON urls
  FOR DELETE USING (auth.uid() = user_id::uuid);

-- Policy: Allow anonymous users to view any URL (for redirects)
CREATE POLICY "Anyone can view URLs for redirects" ON urls
  FOR SELECT USING (true);
```

## 3. Upstash Redis Setup ✅

### Create Upstash Account ✅
1. Go to [upstash.com](https://upstash.com) and sign up
2. Click "Create Database"
3. Name: "url-shortener-cache"
4. Region: N. Virginia, USA (us-east-1)
5. Features: Persistence, REST API, TLS, Global

### Get Connection Details ✅
1. Connection Details:
   - **Endpoint**: `https://close-gecko-10852.upstash.io`
   - **REST Token**: `ASpkAAIjcDE1Y2NiMTMyMzU0NWQ0MmE0OTVmMmJhZDgyN2UyYWMyMHAxMA`
   - **Read-Only Token**: `AipkAAIgcDFOfaQtu3-Edf3QrHRLomm6fdowqa8JIE1MQLRZFqI6ZQ`
   - **Redis CLI**: `redis-cli --tls -u redis://default:ASpkAAIjcDE1Y2NiMTMyMzU0NWQ0MmE0OTVmMmJhZDgyN2UyYWMyMHAxMA@close-gecko-10852.upstash.io:6379`

### Vercel Integration ✅
1. Created new Upstash database via Vercel integration
2. Database name: "upstash-kv-fuchsia-village"
3. New connection details:
   - **Endpoint**: `https://accurate-possum-56769.upstash.io`
   - **REST Token**: `Ad3BAAIjcDFmYzg0ZWRkOTMxNTY0YzE2YTgwNTE2NzM0MjUwZGU4M3AxMA`
   - Environment variables automatically added to Vercel with KV_ prefix

## 4. Vercel Setup ✅

### Create Vercel Account ✅
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Import repository: `https://github.com/Lautaroef/url-shortener`
3. Project name: "url-shortener"
4. Configure the project:
   - Framework Preset: **Other** (for monorepo)
   - Root Directory: **Leave empty** (monorepo root)
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
5. Domain: `url-shortener-eosin-eight.vercel.app`

### Environment Variables ✅
Added to Vercel dashboard > Settings > Environment Variables:

```bash
# Supabase
DATABASE_URL="postgresql://postgres.zczsddzwicqokspwktxj:.a7Yu7ApHDnACWZ@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.zczsddzwicqokspwktxj:.a7Yu7ApHDnACWZ@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://zczsddzwicqokspwktxj.supabase.co"
SUPABASE_JWT_SECRET="SOLB7C4+L4IC6ZvP4qbiAJ0DQ5+Rq7b4uNuUTVT9338brWvMvgTNAjsefnIXMckeO6A0kTJfOLGS355iE36t6A=="

# Upstash Redis (Vercel KV Integration)
KV_REST_API_URL="https://accurate-possum-56769.upstash.io"
KV_REST_API_TOKEN="Ad3BAAIjcDFmYzg0ZWRkOTMxNTY0YzE2YTgwNTE2NzM0MjUwZGU4M3AxMA"
KV_REST_API_READ_ONLY_TOKEN="At3BAAIgcDF3n5q1VMgOiFQSE7Z3ubKsjtMkGmI260L3tyuuBOJ8vg"

# Plausible
PLAUSIBLE_DOMAIN="url-shortener-eosin-eight.vercel.app"
PLAUSIBLE_API_KEY="" # TODO: Get from Plausible settings

# Frontend variables (prefix with NEXT_PUBLIC_)
NEXT_PUBLIC_API_URL="https://url-shortener-eosin-eight.vercel.app/api"
NEXT_PUBLIC_SUPABASE_URL="https://zczsddzwicqokspwktxj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjenNkZHp3aWNxb2tzcHdrdHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODE3NjIsImV4cCI6MjA2NzU1Nzc2Mn0.T7A3i1SVJlASrgEZ7KGG1y_VY23Ds0tdi1mPcJwyZqs"
```

## 5. Environment Variables Setup (Local Development) ✅

### Backend (.env) ✅
Created at `/apps/backend/.env` with all credentials.

### Frontend (.env.local) ✅
Created at `/apps/frontend/.env.local` with all credentials.

⚠️ **Note**: Need to get Plausible API key and update `PLAUSIBLE_API_KEY` in backend .env file.

## 6. Domain Configuration

### Vercel Domain Setup
1. In Vercel dashboard > Settings > Domains
2. Add your custom domain
3. Follow Vercel's instructions to update DNS records
4. Vercel handles SSL automatically

### Update Environment Variables
After domain is configured:
1. Update `PLAUSIBLE_DOMAIN` to your custom domain
2. Update `NEXT_PUBLIC_API_URL` to use your custom domain
3. Redeploy for changes to take effect

## 7. Initial Project Setup

### 1. Git Repository Setup ✅
```bash
# Repository initialized and connected to GitHub
git init
git branch -M main
git remote add origin https://github.com/Lautaroef/url-shortener.git
```

### 2. Monorepo Structure ✅
- Created pnpm workspace configuration
- Set up apps/backend and apps/frontend directories
- Created packages/shared for common types
- Added .gitignore, vercel.json, and package.json

### 3. Install Dependencies 🔄 TODO
```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install dependencies
pnpm install
```

### 4. Basic App Structure ✅
- Created frontend and backend package.json files
- Set up basic Next.js app with Plausible script
- Ready for Plausible to detect the script

### 4. Database Setup with Supabase ✅
```bash
# First, create the Prisma schema file
# Navigate to backend
cd apps/backend

# Initialize Prisma
npx prisma init

# Generate Prisma client
npx prisma generate

# Push schema to Supabase (for initial setup)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate deploy
```

### 5. Create Supabase Auth Trigger ✅
✅ **Status**: Auth trigger created successfully.

The trigger automatically syncs new auth users to the public.users table.

```sql
-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, new.created_at);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Start Development Environment 🔄 TODO
```bash
# From root directory
# First install dependencies if not done
pnpm install

# Terminal 1 - Backend
cd apps/backend
pnpm dev

# Terminal 2 - Frontend  
cd apps/frontend
pnpm dev
```

## 8. Verification Steps

### Test Supabase Connection
```bash
cd apps/backend
npx prisma studio  # Opens Prisma Studio to view Supabase database
```

### Test Upstash Redis
1. Check Upstash dashboard for connection metrics
2. Create a URL and verify caching works (check logs)

### Test Supabase Auth
1. Sign up a new user in your frontend
2. Check Supabase dashboard > Authentication > Users
3. Verify user appears in both auth.users and public.users tables

### Test Plausible Integration  
1. Create a shortened URL
2. Access the shortened URL
3. Check your Plausible dashboard - you should see the event tracked

### Test Vercel Deployment
1. Push to your main branch
2. Check Vercel dashboard for build status
3. Visit your deployment URL

## 9. Additional Services

### Monitoring and Observability

#### Vercel Analytics (Recommended)
1. Enable in Vercel dashboard > Analytics
2. Provides Web Vitals and performance metrics

#### Error Tracking with Sentry
1. Create account at [sentry.io](https://sentry.io)
2. Add Sentry integration in Vercel
3. Configure in your code:

```typescript
// apps/backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Edge Functions for Redirects (Optional Performance Optimization)
For ultra-fast redirects, consider using Vercel Edge Functions:

```typescript
// apps/frontend/src/app/[slug]/route.ts
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  // Implement redirect logic using Upstash Redis REST API
  // This runs at the edge, closer to users
}
```

## 10. Troubleshooting

### Supabase Connection Issues
- Verify you're using the pooled connection string for the app
- Check if you've reached connection limits in Supabase dashboard
- Ensure your IP is whitelisted (if using IP restrictions)

### Vercel Deployment Failures
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify monorepo configuration in vercel.json

### Supabase Auth Issues
- Check if email confirmations are required (disable for development)
- Verify JWT secret matches between Supabase and your backend
- Check RLS policies aren't blocking access

### Plausible Events Not Showing  
- Ensure `PLAUSIBLE_DOMAIN` matches your Vercel domain
- For localhost testing, add localhost to Plausible sites
- Check browser console for CORS errors

### Upstash Redis Issues
- Check if you've hit request limits
- Verify REST token has correct permissions
- Monitor eviction if database is full

## Next Steps

Once all manual setup is complete:
1. Verify all services are connected (Supabase, Upstash, Plausible)
2. Test creating a short URL with authentication
3. Test the redirect functionality and caching
4. Check Plausible dashboard for tracked events
5. Deploy to Vercel and test production environment
6. Begin development following the implementation phases

### Current Status & Next Steps

#### ✅ Completed:
- [x] GitHub repository created and initialized
- [x] Plausible account created and script detected
- [x] Supabase project created with credentials
- [x] Upstash Redis database created (2 instances)
- [x] Vercel project imported and configured
- [x] Environment variables synced with Vercel
- [x] Monorepo structure set up
- [x] Dependencies installed
- [x] Prisma schema created and pushed to Supabase
- [x] Basic Next.js app deployed to Vercel

#### 🔄 TODO:
- [ ] Enable RLS policies on Supabase (manual)
- [ ] Create auth trigger in Supabase (manual)
- [ ] Build the actual URL shortener functionality
- [ ] Implement authentication with Supabase Auth
- [ ] Create URL shortening UI
- [ ] Implement redirect logic
- [ ] Add analytics tracking
- [ ] Test all integrations

#### 📝 Important Notes:
1. **Vercel domain**: Using `url-shortener-eosin-eight.vercel.app` for Plausible
2. **Plausible Script**: Added to Next.js layout, waiting for detection
3. **Upstash Integration**: Now using Vercel KV with new credentials
4. **First Commit**: ✅ Pushed to GitHub
5. **Next Step**: Deploy to Vercel so Plausible can detect the script
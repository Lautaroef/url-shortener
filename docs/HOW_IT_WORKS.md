# URL Shortener - Technical Deep Dive

A comprehensive guide to the architecture and implementation details of the URL shortener application.

## Architecture Overview

The application follows a modern, scalable architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js       │────▶│    NestJS        │────▶│   Supabase     │
│   Frontend      │     │    Backend       │     │   PostgreSQL   │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          ▲
                               │                          │
                               ▼                          │
                        ┌─────────────────┐               │
                        │                 │               │
                        │  Upstash Redis  │───────────────┘
                        │    (Cache)      │    (Batch sync)
                        │                 │
                        └─────────────────┘
```

## Key Features & Implementation

### 1. URL Shortening
- **Unique ID Generation**: Uses nanoid (7 characters) for collision-resistant short codes
- **Custom Slugs**: Users can specify memorable URLs with validation
- **Dual Access**: Works for both authenticated and anonymous users

### 2. Performance-First Redirects
- **Redis Cache Layer**: All lookups hit Redis first (< 1ms response time)
- **Database Fallback**: PostgreSQL serves as persistent storage
- **301 Redirects**: SEO-friendly permanent redirects

### 3. Real-Time Analytics
- **Non-Blocking Tracking**: Visit tracking happens asynchronously
- **Batch Processing**: Visits are queued in Redis and batch-synced every 5 minutes
- **Privacy by Design**: IP addresses are SHA256 hashed before storage

## Technical Stack

### Frontend (Next.js 14)
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: React hooks and context
- **API Client**: Custom fetch wrapper with auth integration
- **Authentication**: Supabase Auth SDK
- **Forms**: React Hook Form with Zod validation

### Backend (NestJS)
- **Framework**: NestJS with modular architecture
- **Database ORM**: Prisma
- **Caching**: Upstash Redis (via Vercel KV)
- **Authentication**: Custom guards with JWT validation
- **Rate Limiting**: @nestjs/throttler (30 req/min)
- **Scheduling**: @nestjs/schedule for cron jobs

### Infrastructure
- **Database**: Supabase PostgreSQL with Row Level Security
- **Cache**: Upstash Redis for high-performance operations
- **Hosting**: Vercel (serverless functions)
- **Analytics**: Plausible Analytics (privacy-focused)

## Core Workflows

### URL Creation Flow
1. User submits URL through React Hook Form with Zod validation
2. Backend validates and generates/checks slug uniqueness
3. URL stored in PostgreSQL and cached in Redis
4. Returns short URL immediately for sharing

### Redirect Flow
1. User visits short URL
2. Next.js route handler forwards to backend
3. Backend checks Redis cache first (< 1ms)
4. Falls back to database if cache miss
5. Tracks visit asynchronously
6. Returns 301 redirect to original URL

### Visit Tracking
- **Real-time**: Redis atomic counters for instant updates
- **Queued Processing**: Visit details queued for batch insertion
- **Privacy-First**: IPs hashed, minimal data collected
- **Cron Job**: Syncs to PostgreSQL every 5 minutes

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  urls      Url[]
}

model Url {
  id          Int      @id @default(autoincrement())
  shortCode   String   @unique
  originalUrl String
  userId      String?  // Null for anonymous URLs
  visits      Visit[]
}

model Visit {
  id          Int      @id @default(autoincrement())
  urlId       Int
  visitedAt   DateTime
  ipHash      String?  // SHA256 hashed
  userAgent   String?
  referer     String?
}
```

## Caching Strategy

### Redis Keys
- `url:{slug}` - Cached original URLs (TTL: 1 hour)
- `url:{slug}:id` - Cached URL IDs for tracking
- `visits:{slug}` - Real-time visit counters
- `visits:queue` - Queue for batch processing

## Performance Optimizations

### Database
- Indexes on `shortCode`, `userId`, `urlId`, `visitedAt`
- Connection pooling via PgBouncer
- Batch inserts for visit data

### Application
- Parallel data fetching with Promise.all
- Lazy loading for analytics
- Edge caching for static assets
- Singleton Redis connections

## Security & Privacy

- **Rate Limiting**: 30 requests/minute using @nestjs/throttler
- **Input Validation**: Zod (frontend) + class-validator (backend)
- **SQL Injection Protection**: Parameterized queries via Prisma
- **Authentication**: JWT tokens with Supabase Auth
- **Privacy**: No personal data stored, IPs hashed with SHA256
- **RLS Policies**: Row-level security on database tables

## Key Design Decisions

1. **Serverless Architecture**: Optimized for Vercel's infrastructure
2. **Monorepo Structure**: Shared types and unified deployment
3. **Redis for Speed**: Critical path operations never touch the database
4. **Batch Processing**: Balances real-time needs with database efficiency
5. **Progressive Enhancement**: Features work without authentication

## Deployment

- **Frontend & Backend**: Deployed as Vercel Functions
- **Database**: Supabase managed PostgreSQL
- **Redis**: Upstash via Vercel KV integration
- **Environment**: Separate staging and production environments
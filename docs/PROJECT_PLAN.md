# URL Shortener - Project Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for an enterprise-grade URL shortener application. The project will demonstrate best practices in modern web development using TypeScript throughout the stack.

## Architecture Overview

### Tech Stack

**Backend:**
- **Framework:** NestJS (TypeScript) - deployed as Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL) with Prisma ORM
- **Cache:** Upstash Redis for high-performance redirects
- **Authentication:** Supabase Auth (JWT-based)
- **Analytics:** Plausible Analytics (third-party service)

**Frontend:**
- **Framework:** Next.js 14+ with App Router (TypeScript)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form with Zod validation
- **API Client:** Axios with interceptors

**Infrastructure:**
- **Deployment:** Vercel (both frontend and backend)
- **Package Management:** pnpm workspaces (monorepo)
- **Development:** Docker Compose (Redis only for local dev)

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│   Next.js App   │────▶│  NestJS Backend  │────▶│  External Services      │
│  (Vercel Edge)  │     │ (Vercel Functions)│     │  - Plausible Analytics  │
└─────────────────┘     └────────┬─────────┘     │  - Supabase Auth       │
                                 │                └─────────────────────────┘
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼──────┐          ┌──────▼──────┐
              │  Supabase   │          │   Upstash   │
              │ PostgreSQL  │          │    Redis    │
              └─────────────┘          └─────────────┘
```

## Project Structure

### Monorepo Layout

```
url-shortener/
├── apps/
│   ├── backend/                 # NestJS application
│   │   ├── src/
│   │   │   ├── core/           # Cross-cutting concerns
│   │   │   │   ├── config/     # Configuration management
│   │   │   │   ├── database/   # Prisma setup
│   │   │   │   └── cache/      # Redis configuration
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # Authentication
│   │   │   │   ├── url/        # URL management
│   │   │   │   ├── redirect/   # Redirect handling
│   │   │   │   ├── user/       # User management
│   │   │   │   ├── analytics/  # Consolidated analytics
│   │   │   │   └── plausible/  # Analytics integration
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── Dockerfile
│   │
│   └── frontend/                # Next.js application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/     # Auth routes
│       │   │   ├── (dashboard)/# Protected routes
│       │   │   │   └── analytics/  # Consolidated analytics dashboard
│       │   │   ├── [slug]/     # Dynamic redirect handling
│       │   │   └── page.tsx    # Home page
│       │   ├── components/     # React components
│       │   ├── lib/           # Utilities
│       │   └── services/      # API services
│       └── Dockerfile
│
├── packages/
│   └── shared/                 # Shared types/interfaces
│       ├── src/
│       │   ├── dto/           # Data transfer objects
│       │   └── types/         # TypeScript types
│       └── package.json
│
├── vercel.json                 # Vercel deployment configuration
├── docker-compose.yml          # Local development (Redis only)
├── pnpm-workspace.yaml         # Monorepo configuration
└── README.md
```

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model User {
  id           String   @id @db.Uuid // Supabase Auth uses UUIDs
  email        String   @unique
  createdAt    DateTime @default(now()) @map("created_at")
  
  urls         Url[]
  
  @@map("users")
}

model Url {
  id          Int      @id @default(autoincrement())
  shortCode   String   @unique @map("short_code") @db.VarChar(12)
  originalUrl String   @map("original_url")
  userId      String?  @map("user_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([shortCode])
  @@index([userId])
  @@map("urls")
}
```

## API Endpoints

### Authentication
Authentication is handled by Supabase Auth on the frontend. The backend validates Supabase JWTs.

### URL Management
- `POST /api/v1/urls` - Create short URL
- `GET /api/v1/urls` - List user's URLs (protected)
- `PUT /api/v1/urls/:id` - Update URL slug (protected)
- `DELETE /api/v1/urls/:id` - Delete URL (protected)
- `GET /api/v1/analytics` - Get analytics for all user's URLs (protected)

### Redirect
- `GET /:slug` - Redirect to original URL

## Key Features Implementation

### 1. URL Shortening Service

```typescript
// apps/backend/src/modules/url/url.service.ts
import { nanoid } from 'nanoid';

export class UrlService {
  async create(dto: CreateUrlDto, userId?: number): Promise<Url> {
    const shortCode = dto.customSlug || await this.generateUniqueShortCode();
    
    // Validate custom slug availability
    if (dto.customSlug) {
      const existing = await this.prisma.url.findUnique({
        where: { shortCode: dto.customSlug }
      });
      if (existing) {
        throw new ConflictException('Custom slug already taken');
      }
    }
    
    return this.prisma.url.create({
      data: {
        shortCode,
        originalUrl: dto.originalUrl,
        userId,
      }
    });
  }
  
  private async generateUniqueShortCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = nanoid(7);
      const existing = await this.prisma.url.findUnique({
        where: { shortCode: code }
      });
      if (!existing) return code;
      attempts++;
    }
    throw new Error('Failed to generate unique code');
  }
}
```

### 2. High-Performance Redirect with Redis Caching

```typescript
// apps/backend/src/modules/redirect/redirect.controller.ts
@Controller()
export class RedirectController {
  @Get(':slug')
  async handleRedirect(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // Check Redis cache first
    let originalUrl = await this.cacheManager.get<string>(`url:${slug}`);
    
    if (!originalUrl) {
      // Cache miss - check database
      const url = await this.urlService.findBySlug(slug);
      if (!url) {
        return res.status(404).json({ message: 'URL not found' });
      }
      
      originalUrl = url.originalUrl;
      
      // Cache for 1 hour
      await this.cacheManager.set(`url:${slug}`, originalUrl, 3600);
    }
    
    // Track analytics (non-blocking)
    this.plausibleService.trackRedirect(slug, originalUrl, req.ip, req.headers['user-agent']);
    
    return res.redirect(301, originalUrl);
  }
}
```

### 3. Plausible Analytics Integration

```typescript
// apps/backend/src/modules/plausible/plausible.service.ts
@Injectable()
export class PlausibleService {
  trackRedirect(slug: string, originalUrl: string, userIp: string, userAgent: string): void {
    const payload = {
      name: 'redirect',
      url: `https://yourdomain.com/event/redirect/${slug}`,
      domain: this.configService.get('PLAUSIBLE_DOMAIN'),
      props: { originalUrl }
    };
    
    // Fire and forget - non-blocking
    this.httpService.post('https://plausible.io/api/event', payload, {
      headers: {
        'User-Agent': userAgent,
        'X-Forwarded-For': userIp,
      }
    }).toPromise().catch(error => {
      this.logger.error(`Failed to track redirect for ${slug}`, error);
    });
  }
  
  async getStats(slug: string): Promise<any> {
    const response = await this.httpService.get(
      `https://plausible.io/api/v1/stats/aggregate`,
      {
        params: {
          site_id: this.configService.get('PLAUSIBLE_DOMAIN'),
          filters: `event:page==/event/redirect/${slug}`,
          metrics: 'visitors,pageviews'
        },
        headers: {
          'Authorization': `Bearer ${this.configService.get('PLAUSIBLE_API_KEY')}`
        }
      }
    ).toPromise();
    
    return response.data;
  }
  
  async getBulkStats(slugs: string[]): Promise<Map<string, any>> {
    const statsMap = new Map();
    
    // Batch requests for efficiency
    const promises = slugs.map(slug => 
      this.getStats(slug)
        .then(stats => statsMap.set(slug, stats))
        .catch(error => {
          this.logger.error(`Failed to get stats for ${slug}`, error);
          statsMap.set(slug, { visitors: 0, pageviews: 0 });
        })
    );
    
    await Promise.all(promises);
    return statsMap;
  }
}
```

### 4. Supabase Authentication Integration

```typescript
// apps/backend/src/modules/auth/strategies/supabase.strategy.ts
@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email };
  }
}
```

### 5. Consolidated Analytics API

The analytics endpoint provides a unified view of all URLs and their popularity metrics:

```typescript
// apps/frontend/src/services/analytics.service.ts
export class AnalyticsService {
  async getAllUrlAnalytics(): Promise<AnalyticsResponse> {
    const response = await apiClient.get('/api/v1/analytics');
    return response.data;
  }
}

// Response format
interface AnalyticsResponse {
  urls: Array<{
    id: number;
    shortCode: string;
    originalUrl: string;
    createdAt: string;
    visitors: number;
    pageviews: number;
  }>;
}
```

### 6. Rate Limiting

```typescript
// apps/backend/src/app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10, // 10 requests per minute for anonymous users
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

## Frontend Components

### URL Shortener Form

```tsx
// apps/frontend/src/components/url-shortener-form.tsx
export function UrlShortenerForm() {
  const form = useForm<CreateUrlInput>({
    resolver: zodResolver(createUrlSchema),
  });
  
  const onSubmit = async (data: CreateUrlInput) => {
    try {
      const response = await urlService.createUrl(data);
      toast.success('URL shortened successfully!');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(response.shortUrl);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to shorten URL');
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register('originalUrl')} placeholder="Enter URL to shorten" />
      <Input {...form.register('customSlug')} placeholder="Custom slug (optional)" />
      <Button type="submit">Shorten URL</Button>
    </form>
  );
}
```

### Analytics Service Implementation

```typescript
// apps/backend/src/modules/analytics/analytics.controller.ts
@Controller('analytics')
export class AnalyticsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllAnalytics(@Request() req) {
    const userId = req.user.id;
    
    // Get all URLs for the user
    const urls = await this.urlService.getUserUrls(userId);
    
    // Get analytics for all URLs in bulk
    const slugs = urls.map(url => url.shortCode);
    const statsMap = await this.plausibleService.getBulkStats(slugs);
    
    // Combine URL data with analytics
    const urlsWithAnalytics = urls.map(url => ({
      ...url,
      visitors: statsMap.get(url.shortCode)?.visitors || 0,
      pageviews: statsMap.get(url.shortCode)?.pageviews || 0,
    }));
    
    return { urls: urlsWithAnalytics };
  }
}
```

## Implementation Phases

### Phase 1: Core Backend (Days 1-3)
- [ ] Initialize NestJS project with Prisma
- [ ] Connect to Supabase database
- [ ] Set up Upstash Redis for caching
- [ ] Implement URL creation and slug generation
- [ ] Build redirect functionality with caching
- [ ] Configure for Vercel deployment

### Phase 2: Frontend & Auth (Days 4-6)
- [ ] Initialize Next.js project
- [ ] Set up Supabase Auth client
- [ ] Build URL shortener form UI
- [ ] Implement authentication flow
- [ ] Create user dashboard
- [ ] Integrate with backend API

### Phase 3: Enterprise Features (Days 7-9)
- [ ] Integrate Plausible Analytics
- [ ] Implement rate limiting
- [ ] Add URL validation
- [ ] Build consolidated analytics dashboard at `/dashboard/analytics`
- [ ] Deploy to Vercel
- [ ] Set up custom domain

## Security Considerations

1. **Input Validation:** All inputs validated with Zod schemas
2. **Rate Limiting:** Different limits for authenticated/anonymous users
3. **URL Validation:** Ensure valid URLs with proper protocols
4. **Authentication:** JWT with secure httpOnly cookies for refresh tokens
5. **CORS:** Properly configured for production domains

## Performance Optimizations

1. **Redis Caching:** Sub-millisecond redirect lookups
2. **Async Analytics:** Non-blocking Plausible API calls
3. **Database Indexing:** Indexes on shortCode and userId
4. **Connection Pooling:** Prisma connection pool configuration

## Environment Variables

```env
# Backend (.env)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.supabase.co:5432/postgres"
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_JWT_SECRET="your-jwt-secret-from-supabase"
PLAUSIBLE_DOMAIN="yourdomain.com"
PLAUSIBLE_API_KEY="your-plausible-api-key"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Vercel Deployment Configuration

```json
// vercel.json (at monorepo root)
{
  "version": 2,
  "builds": [
    {
      "src": "apps/backend/src/main.ts",
      "use": "@vercel/node"
    },
    {
      "src": "apps/frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/apps/backend/src/main.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/apps/frontend"
    }
  ]
}
```

## Local Development Setup

```yaml
# docker-compose.yml (for local Redis only)
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Next Steps

1. Initialize the monorepo structure
2. Set up the development environment with Docker
3. Begin Phase 1 implementation
4. Regular progress reviews after each phase

This plan provides a solid foundation for building an enterprise-grade URL shortener that meets all requirements while following industry best practices.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async getUrlAnalytics(urlId: number, userId?: string) {
    // Verify ownership if userId is provided
    if (userId) {
      const url = await this.prisma.url.findFirst({
        where: { id: urlId, userId },
      });
      
      if (!url) {
        throw new Error('URL not found or access denied');
      }
    }

    // Get visit count from cache (real-time)
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
      select: { shortCode: true },
    });
    
    const realtimeCount = await this.cache.get<number>(`visits:${url.shortCode}`) || 0;

    // Get visit details from database
    const [totalVisits, recentVisits, visitsByDay] = await Promise.all([
      // Total visits from database
      this.prisma.visit.count({
        where: { urlId },
      }),
      
      // Recent visits
      this.prisma.visit.findMany({
        where: { urlId },
        orderBy: { visitedAt: 'desc' },
        take: 10,
        select: {
          visitedAt: true,
          country: true,
          referer: true,
        },
      }),
      
      // Visits grouped by day (last 7 days)
      this.getVisitsByDay(urlId, 7),
    ]);

    // Combine database count with real-time count
    const totalCount = totalVisits + realtimeCount;

    return {
      totalVisits: totalCount,
      realtimeVisits: realtimeCount,
      recentVisits,
      visitsByDay,
    };
  }

  private async getVisitsByDay(urlId: number, days: number) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Include all of today
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1)); // Past 6 days + today = 7 days
    startDate.setHours(0, 0, 0, 0);
    
    // Get visits from database
    const dbVisits = await this.prisma.visit.findMany({
      where: {
        urlId,
        visitedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        visitedAt: true,
      },
    });

    // Get the URL's shortCode to check Redis for today's visits
    const url = await this.prisma.url.findUnique({
      where: { id: urlId },
      select: { shortCode: true },
    });

    // Group database visits by date
    const visitsByDate = new Map<string, number>();
    
    dbVisits.forEach(visit => {
      const date = visit.visitedAt.toISOString().split('T')[0];
      visitsByDate.set(date, (visitsByDate.get(date) || 0) + 1);
    });

    // Add today's real-time visits from Redis
    const todayStr = new Date().toISOString().split('T')[0];
    const realtimeVisits = url ? (await this.cache.get<number>(`visits:${url.shortCode}`) || 0) : 0;
    
    // If we have visits in the database for today, add the realtime count
    // Otherwise, set today's count to the realtime count
    if (visitsByDate.has(todayStr)) {
      visitsByDate.set(todayStr, visitsByDate.get(todayStr)! + realtimeVisits);
    } else {
      visitsByDate.set(todayStr, realtimeVisits);
    }

    // Fill in all days including today
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        visits: visitsByDate.get(dateStr) || 0,
      });
    }

    return result;
  }

  async getUserAnalytics(userId: string) {
    const [totalUrls, dbVisits, recentUrls] = await Promise.all([
      // Total URLs created
      this.prisma.url.count({
        where: { userId },
      }),
      
      // Total visits across all URLs from database
      this.prisma.visit.count({
        where: {
          url: { userId },
        },
      }),
      
      // Recent URLs with visit counts
      this.prisma.url.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { visits: true },
          },
        },
      }),
    ]);

    // Get real-time visits for each URL
    let totalRealtimeVisits = 0;
    const urlsWithRealtimeVisits = await Promise.all(
      recentUrls.map(async (url) => {
        const realtimeVisits = await this.cache.get<number>(`visits:${url.shortCode}`) || 0;
        totalRealtimeVisits += realtimeVisits;
        return {
          id: url.id,
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          createdAt: url.createdAt,
          visits: url._count.visits + realtimeVisits,
        };
      })
    );

    // Get all user's URLs to calculate total real-time visits
    const allUserUrls = await this.prisma.url.findMany({
      where: { userId },
      select: { shortCode: true },
    });

    let allRealtimeVisits = 0;
    for (const url of allUserUrls) {
      const realtimeVisits = await this.cache.get<number>(`visits:${url.shortCode}`) || 0;
      allRealtimeVisits += realtimeVisits;
    }

    return {
      totalUrls,
      totalVisits: dbVisits + allRealtimeVisits,
      recentUrls: urlsWithRealtimeVisits,
    };
  }

  async debugQueue() {
    const queueItems = await this.cache.lrange('visits:queue', 0, -1);
    const visitKeys = await this.cache.keys('visits:*');
    
    const visitCounts: Record<string, number> = {};
    for (const key of visitKeys) {
      if (!key.includes(':queue') && !key.includes(':id')) {
        const count = await this.cache.get<number>(key);
        visitCounts[key] = count || 0;
      }
    }
    
    return {
      queueLength: queueItems.length,
      queueItems: queueItems.slice(0, 5).map(item => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      }),
      visitCounts,
    };
  }
}
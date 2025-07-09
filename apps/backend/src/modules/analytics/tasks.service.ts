import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { CacheService } from '../../core/cache/cache.service';
import * as crypto from 'crypto';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  // Run every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processVisitQueue() {
    this.logger.log('Processing visit queue...');
    
    try {
      // Get all visits from the queue
      const visits = await this.cache.lrange('visits:queue', 0, -1);
      
      if (visits.length === 0) {
        this.logger.log('No visits to process');
        return;
      }

      this.logger.log(`Processing ${visits.length} visits`);

      // Parse and prepare visit data
      const visitRecords = [];
      
      for (const visitJson of visits) {
        try {
          const visit = JSON.parse(visitJson);
          
          // Skip if we don't have the URL ID
          if (!visit.urlId) {
            // Try to get it from the database
            const url = await this.prisma.url.findUnique({
              where: { shortCode: visit.slug },
              select: { id: true },
            });
            
            if (!url) {
              this.logger.warn(`URL not found for slug: ${visit.slug}`);
              continue;
            }
            
            visit.urlId = url.id;
          }

          // Hash IP for privacy
          const ipHash = visit.ip 
            ? crypto.createHash('sha256').update(visit.ip).digest('hex')
            : null;

          visitRecords.push({
            urlId: visit.urlId,
            visitedAt: new Date(visit.timestamp),
            ipHash,
            userAgent: visit.userAgent,
            referer: visit.referer,
            country: null, // We could add IP geolocation later
          });
        } catch (error) {
          this.logger.error(`Failed to parse visit: ${error.message}`);
        }
      }

      // Batch insert visits
      if (visitRecords.length > 0) {
        this.logger.log(`Attempting to insert ${visitRecords.length} visits`);
        this.logger.log(`Visit records: ${JSON.stringify(visitRecords)}`);
        
        try {
          const result = await this.prisma.visit.createMany({
            data: visitRecords,
            skipDuplicates: true,
          });
          
          this.logger.log(`Successfully inserted ${result.count} visits`);
        } catch (error) {
          this.logger.error(`Failed to insert visits: ${error.message}`);
          throw error;
        }
      }

      // Clear the processed visits from the queue
      await this.cache.ltrim('visits:queue', visits.length, -1);
      
      // Process visit counters
      await this.processVisitCounters();
      
    } catch (error) {
      this.logger.error(`Failed to process visit queue: ${error.message}`);
    }
  }

  private async processVisitCounters() {
    try {
      // Get all visit counter keys
      const keys = await this.cache.keys('visits:*');
      const counterKeys = keys.filter(key => !key.includes(':queue') && !key.includes(':id'));

      for (const key of counterKeys) {
        const slug = key.replace('visits:', '');
        const count = await this.cache.get<number>(key);
        
        if (count && count > 0) {
          // Update the URL's visit count
          await this.prisma.url.updateMany({
            where: { shortCode: slug },
            data: {
              // We'll add a visitCount field to the URL model
              // For now, just log it
            },
          });
          
          this.logger.log(`URL ${slug} has ${count} visits`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process visit counters: ${error.message}`);
    }
  }
}
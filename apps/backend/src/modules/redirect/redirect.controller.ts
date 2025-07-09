import { Controller, Get, Param, Res, NotFoundException, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { UrlService } from '../url/url.service';
import { CacheService } from '../../core/cache/cache.service';

@Controller()
export class RedirectController {
  constructor(
    private urlService: UrlService,
    private cache: CacheService,
  ) {}

  @Get(':slug')
  async handleRedirect(
    @Param('slug') slug: string, 
    @Res() res: Response,
    @Req() req: Request
  ) {
    // Check cache first for performance
    let originalUrl = await this.cache.get<string>(`url:${slug}`);
    let urlId: number | null = null;
    
    if (!originalUrl) {
      // Cache miss - check database
      const url = await this.urlService.findBySlug(slug);
      
      if (!url) {
        throw new NotFoundException('Short URL not found');
      }
      
      originalUrl = url.originalUrl;
      urlId = url.id;
      
      // Cache both URL and ID for future requests
      await Promise.all([
        this.cache.set(`url:${slug}`, originalUrl, 3600), // 1 hour
        this.cache.set(`url:${slug}:id`, url.id, 3600),
      ]);
    } else {
      // Try to get URL ID from cache
      urlId = await this.cache.get<number>(`url:${slug}:id`);
    }
    
    // Track visit asynchronously (fire and forget)
    this.trackVisit(slug, urlId, req).catch(err => {
      console.error('Failed to track visit:', err);
    });
    
    // Redirect to the original URL
    return res.redirect(301, originalUrl);
  }

  private async trackVisit(slug: string, urlId: number | null, req: Request) {
    try {
      // Increment visit counter in Redis
      await this.cache.increment(`visits:${slug}`);
      
      // Store additional visit data for batch processing
      const visitData = {
        slug,
        urlId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || null,
        referer: req.headers['referer'] || null,
        ip: req.ip || req.socket.remoteAddress || null,
      };
      
      // Add to a list for batch processing
      await this.cache.lpush('visits:queue', JSON.stringify(visitData));
    } catch (error) {
      // Don't throw - this is non-critical
      console.error('Error tracking visit:', error);
    }
  }
}
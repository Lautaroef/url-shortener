import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { UrlService } from '../url/url.service';
import { CacheService } from '../../core/cache/cache.service';

@Controller()
export class RedirectController {
  constructor(
    private urlService: UrlService,
    private cache: CacheService,
  ) {}

  @Get(':slug')
  async handleRedirect(@Param('slug') slug: string, @Res() res: Response) {
    // Check cache first for performance
    let originalUrl = await this.cache.get<string>(`url:${slug}`);
    
    if (!originalUrl) {
      // Cache miss - check database
      const url = await this.urlService.findBySlug(slug);
      
      if (!url) {
        throw new NotFoundException('Short URL not found');
      }
      
      originalUrl = url.originalUrl;
      
      // Cache for future requests
      await this.cache.set(`url:${slug}`, originalUrl, 3600); // 1 hour
    }
    
    // TODO: Track analytics here (non-blocking)
    
    // Redirect to the original URL
    return res.redirect(301, originalUrl);
  }
}
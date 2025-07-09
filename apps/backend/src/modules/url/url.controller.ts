import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('urls')
@UseGuards(OptionalAuthGuard)
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUrlDto: CreateUrlDto, @Request() req: any) {
    const userId = req.user?.userId;
    const url = await this.urlService.create(createUrlDto, userId);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      userId: url.userId,
      createdAt: url.createdAt,
    };
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId;
    const urls = await this.urlService.findAll(userId);
    
    return urls.map(url => ({
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      userId: url.userId,
      createdAt: url.createdAt,
      visits: (url as any).visits || 0,
    }));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.userId;
    const url = await this.urlService.findOne(id, userId);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      userId: url.userId,
      createdAt: url.createdAt,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUrlDto: UpdateUrlDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;
    const url = await this.urlService.update(id, updateUrlDto, userId);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      userId: url.userId,
      createdAt: url.createdAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user?.userId;
    await this.urlService.remove(id, userId);
  }
}
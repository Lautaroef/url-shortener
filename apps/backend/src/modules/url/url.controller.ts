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
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';

@Controller('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUrlDto: CreateUrlDto) {
    const url = await this.urlService.create(createUrlDto);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    };
  }

  @Get()
  async findAll() {
    const urls = await this.urlService.findAll();
    
    return urls.map(url => ({
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    }));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const url = await this.urlService.findOne(id);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUrlDto: UpdateUrlDto,
  ) {
    const url = await this.urlService.update(id, updateUrlDto);
    
    return {
      id: url.id,
      shortCode: url.shortCode,
      shortUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.urlService.remove(id);
  }
}
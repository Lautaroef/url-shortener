import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/database/prisma.service";
import { CacheService } from "../../core/cache/cache.service";
import { CreateUrlDto } from "./dto/create-url.dto";
import { UpdateUrlDto } from "./dto/update-url.dto";
import { nanoid } from "nanoid";
import { Url } from "@prisma/client";

@Injectable()
export class UrlService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(createUrlDto: CreateUrlDto, userId?: string): Promise<Url> {
    const { originalUrl, customSlug } = createUrlDto;

    // Generate or validate slug
    const shortCode = customSlug || (await this.generateUniqueShortCode());

    // Check if custom slug is already taken
    if (customSlug) {
      const existing = await this.prisma.url.findUnique({
        where: { shortCode: customSlug },
      });

      if (existing) {
        throw new ConflictException("This custom slug is already taken");
      }
    }

    // Create the URL
    const url = await this.prisma.url.create({
      data: {
        shortCode,
        originalUrl,
        userId,
      },
    });

    // Cache the URL for fast redirects
    await this.cache.set(`url:${shortCode}`, originalUrl, 3600); // 1 hour

    return url;
  }

  async findAll(userId?: string): Promise<any[]> {
    const where = userId ? { userId } : {};

    const urls = await this.prisma.url.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shortCode: true,
        originalUrl: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { visits: true },
        },
      },
    });

    // Add real-time visit counts from cache
    const urlsWithVisits = await Promise.all(
      urls.map(async (url) => {
        const realtimeVisits =
          (await this.cache.get<number>(`visits:${url.shortCode}`)) || 0;
        return {
          ...url,
          visits: url._count.visits + realtimeVisits,
        };
      }),
    );

    return urlsWithVisits;
  }

  async findOne(id: number, userId?: string): Promise<Url> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const url = await this.prisma.url.findFirst({ where });

    if (!url) {
      throw new NotFoundException("URL not found");
    }

    return url;
  }

  async findBySlug(shortCode: string): Promise<Url | null> {
    return this.prisma.url.findUnique({
      where: { shortCode },
    });
  }

  async update(
    id: number,
    updateUrlDto: UpdateUrlDto,
    userId?: string,
  ): Promise<Url> {
    // Check if URL exists and belongs to user
    const existingUrl = await this.findOne(id, userId);

    // Check if new slug is available
    const slugTaken = await this.prisma.url.findFirst({
      where: {
        shortCode: updateUrlDto.slug,
        id: { not: id },
      },
    });

    if (slugTaken) {
      throw new ConflictException("This slug is already taken");
    }

    // Update the URL
    const updated = await this.prisma.url.update({
      where: { id },
      data: { shortCode: updateUrlDto.slug },
    });

    // Update cache
    await this.cache.delete(`url:${existingUrl.shortCode}`);
    await this.cache.set(`url:${updated.shortCode}`, updated.originalUrl, 3600);

    return updated;
  }

  async remove(id: number, userId?: string): Promise<void> {
    // Check if URL exists and belongs to user
    const url = await this.findOne(id, userId);

    // Delete from cache
    await this.cache.delete(`url:${url.shortCode}`);

    // Delete from database
    await this.prisma.url.delete({
      where: { id },
    });
  }

  private async generateUniqueShortCode(): Promise<string> {
    let attempts = 0;

    while (attempts < 10) {
      const code = nanoid(7);
      const existing = await this.prisma.url.findUnique({
        where: { shortCode: code },
      });

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error("Failed to generate unique short code");
  }
}

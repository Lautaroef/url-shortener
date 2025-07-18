import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";

@Injectable()
export class CacheService {
  private redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      url: this.configService.get<string>("KV_REST_API_URL"),
      token: this.configService.get<string>("KV_REST_API_TOKEN"),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.get<T>(key);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.set(key, value, { ex: ttlSeconds });
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  async lpush(key: string, value: string): Promise<number> {
    try {
      return await this.redis.lpush(key, value);
    } catch (error) {
      console.error(`Cache lpush error for key ${key}:`, error);
      throw error;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      console.error(`Cache lrange error for key ${key}:`, error);
      return [];
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.redis.ltrim(key, start, stop);
    } catch (error) {
      console.error(`Cache ltrim error for key ${key}:`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }
}

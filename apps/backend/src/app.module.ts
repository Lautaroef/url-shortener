import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { DatabaseModule } from "./core/database/database.module";
import { CacheModule } from "./core/cache/cache.module";
import { UrlModule } from "./modules/url/url.module";
import { RedirectModule } from "./modules/redirect/redirect.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "production" ? undefined : ".env",
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 30, // 30 requests per minute
      },
    ]),

    // Core modules
    DatabaseModule,
    CacheModule,

    // Feature modules
    AuthModule,
    UrlModule,
    RedirectModule,
    AnalyticsModule,
  ],
})
export class AppModule {}

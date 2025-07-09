import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";
import { TasksService } from "./tasks.service";

@Module({
  providers: [AnalyticsService, TasksService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

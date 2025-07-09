import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { TasksService } from './tasks.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private tasksService: TasksService,
  ) {}

  @Get('url/:id')
  @UseGuards(AuthGuard)
  async getUrlAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userId = req.user?.userId;
    return this.analyticsService.getUrlAnalytics(id, userId);
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async getUserAnalytics(@Request() req: any) {
    const userId = req.user.userId;
    return this.analyticsService.getUserAnalytics(userId);
  }

  @Post('sync')
  async syncVisits() {
    await this.tasksService.processVisitQueue();
    return { message: 'Visit sync completed' };
  }

  @Get('debug/queue')
  async debugQueue() {
    return this.analyticsService.debugQueue();
  }
}
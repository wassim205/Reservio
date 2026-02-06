import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { StatsService, AdminStats } from './stats.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /admin/stats
   * Get admin dashboard statistics
   * - Only accessible by ADMIN users
   */
  @Get('stats')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminStats(): Promise<{ stats: AdminStats }> {
    const stats = await this.statsService.getAdminStats();
    return { stats };
  }
}

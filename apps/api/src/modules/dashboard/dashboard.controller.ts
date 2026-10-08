import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DashboardSummary } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Ctx, type WorkspaceContext } from '../../common/request-context';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard, WorkspaceGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(@Ctx() ctx: WorkspaceContext): Promise<DashboardSummary> {
    return this.dashboard.summary(ctx);
  }
}

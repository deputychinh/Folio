import { Injectable } from '@nestjs/common';
import {
  addDays,
  EXPIRING_SOON_DAYS,
  RECENT_ACTIVITY_LIMIT,
  WIN_RATE_WINDOW_DAYS,
  type DashboardSummary,
} from '@folio/shared';
import { today } from '../../common/clock';
import type { WorkspaceContext } from '../../common/request-context';
import { QuotesRepository } from '../quotes/quotes.repository';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboard: DashboardRepository,
    private readonly quotes: QuotesRepository,
  ) {}

  async summary(ctx: WorkspaceContext): Promise<DashboardSummary> {
    const now = today();
    const [numbers, currency, expiringSoon, recentActivity] = await Promise.all([
      this.dashboard.numbers(ctx, WIN_RATE_WINDOW_DAYS),
      this.dashboard.currency(ctx),
      this.quotes.listExpiring(ctx, now, addDays(now, EXPIRING_SOON_DAYS)),
      this.dashboard.recentActivity(ctx, RECENT_ACTIVITY_LIMIT),
    ]);
    return {
      currency,
      openValueMinor: numbers.openValueMinor,
      openCount: numbers.openCount,
      wonValueMinor: numbers.wonValueMinor,
      winRatePercent: winRate(numbers.wonCount, numbers.decidedCount),
      expiringSoon,
      recentActivity,
    };
  }
}

/** Accepted ÷ (accepted + declined + expired) in the window, one decimal. Null when nothing was decided. */
export function winRate(won: number, decided: number): number | null {
  return decided === 0 ? null : Math.round((won / decided) * 1000) / 10;
}

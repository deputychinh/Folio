import { Injectable } from '@nestjs/common';
import type { ActivityItem, Currency } from '@folio/shared';
import type { WorkspaceContext } from '../../common/request-context';
import { unwrap } from '../../supabase/db-error';

export interface DashboardNumbers {
  openValueMinor: number;
  openCount: number;
  wonValueMinor: number;
  wonCount: number;
  decidedCount: number;
}

@Injectable()
export class DashboardRepository {
  async numbers(ctx: WorkspaceContext, windowDays: number): Promise<DashboardNumbers> {
    const json = unwrap(
      await ctx.db.rpc('dashboard_summary', { p_workspace_id: ctx.workspaceId, p_window_days: windowDays }),
    ) as Record<string, number>;
    return {
      openValueMinor: Number(json.open_value_minor),
      openCount: Number(json.open_count),
      wonValueMinor: Number(json.won_value_minor),
      wonCount: Number(json.won_count),
      decidedCount: Number(json.decided_count),
    };
  }

  async currency(ctx: WorkspaceContext): Promise<Currency> {
    return unwrap(await ctx.db.from('workspaces').select('currency').eq('id', ctx.workspaceId).single()).currency;
  }

  async recentActivity(ctx: WorkspaceContext, limit: number): Promise<ActivityItem[]> {
    const rows = unwrap(
      await ctx.db
        .from('quote_events')
        .select('type, created_at, quote_id, quotes(number), profiles(full_name)')
        .eq('workspace_id', ctx.workspaceId)
        .order('created_at', { ascending: false })
        .limit(limit),
    );
    return rows.map((row) => ({
      quoteId: row.quote_id,
      quoteNumber: row.quotes?.number ?? '',
      type: row.type,
      actorName: row.profiles?.full_name ?? null,
      createdAt: row.created_at,
    }));
  }
}

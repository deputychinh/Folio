import { Injectable } from '@nestjs/common';
import {
  QuoteSort,
  type PageMeta,
  type Quote,
  type QuoteEvent,
  type QuoteListItem,
  type QuoteQuery,
  type QuoteTotals,
  type SaveQuoteInput,
} from '@folio/shared';
import { toRange, toSearchPattern } from '../../common/pagination';
import type { WorkspaceContext } from '../../common/request-context';
import type { Database } from '../../supabase/database.types';
import { unwrap } from '../../supabase/db-error';

type QuoteViewRow = Database['public']['Views']['quotes_view']['Row'];
type QuoteItemRow = Database['public']['Tables']['quote_items']['Row'];

const LIST_COLUMNS =
  'id, number, title, effective_status, currency, customer_id, customer_name, valid_until, created_at, ' +
  'subtotal_minor, discount_minor, tax_minor, total_minor';

const SORT: Record<QuoteSort, { column: string; ascending: boolean }> = {
  [QuoteSort.NEWEST]: { column: 'created_at', ascending: false },
  [QuoteSort.VALUE_DESC]: { column: 'total_minor', ascending: false },
  [QuoteSort.VALID_UNTIL_ASC]: { column: 'valid_until', ascending: true },
};

// The view's columns are nullable in the generated types (Postgres cannot prove
// otherwise for views); the base table guarantees them, hence the `!`.
function toListItem(row: Partial<QuoteViewRow>): QuoteListItem {
  return {
    id: row.id!,
    number: row.number!,
    title: row.title!,
    status: row.effective_status!,
    currency: row.currency!,
    customerId: row.customer_id!,
    customerName: row.customer_name!,
    validUntil: row.valid_until!,
    createdAt: row.created_at!,
    subtotalMinor: row.subtotal_minor!,
    discountMinor: row.discount_minor!,
    taxMinor: row.tax_minor!,
    totalMinor: row.total_minor!,
  };
}

function toQuote(row: QuoteViewRow, items: QuoteItemRow[]): Quote {
  return {
    ...toListItem(row),
    discountType: row.discount_type!,
    discountValue: Number(row.discount_value),
    taxPercent: Number(row.tax_percent),
    notes: row.notes ?? '',
    sentAt: row.sent_at,
    viewedAt: row.viewed_at,
    respondedAt: row.responded_at,
    clientName: row.client_name,
    declineReason: row.decline_reason,
    items: items.map((item) => ({
      id: item.id,
      position: item.position,
      catalogItemId: item.catalog_item_id,
      name: item.name,
      unit: item.unit,
      quantity: Number(item.quantity),
      unitPriceMinor: item.unit_price_minor,
      lineTotalMinor: item.line_total_minor,
    })),
  };
}

export interface SaveQuoteRecord {
  input: SaveQuoteInput;
  totals: QuoteTotals;
  lineTotals: number[];
}

@Injectable()
export class QuotesRepository {
  async list(ctx: WorkspaceContext, query: QuoteQuery): Promise<{ items: QuoteListItem[]; meta: PageMeta }> {
    const { from, to, page, pageSize } = toRange(query);
    const sort = SORT[query.sort ?? QuoteSort.NEWEST];
    let request = ctx.db
      .from('quotes_view')
      .select(LIST_COLUMNS, { count: 'exact' })
      .eq('workspace_id', ctx.workspaceId)
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);
    if (query.status) request = request.eq('effective_status', query.status);
    if (query.customerId) request = request.eq('customer_id', query.customerId);
    if (query.search) {
      const pattern = toSearchPattern(query.search);
      request = request.or(`title.ilike.${pattern},number.ilike.${pattern},customer_name.ilike.${pattern}`);
    }
    const { data, count, error } = await request;
    const rows = unwrap({ data, error }) as unknown as Partial<QuoteViewRow>[];
    return { items: rows.map(toListItem), meta: { page, pageSize, total: count ?? 0 } };
  }

  /** Open quotes whose valid-until date falls between today and `until`. */
  async listExpiring(ctx: WorkspaceContext, today: string, until: string): Promise<QuoteListItem[]> {
    const rows = unwrap(
      await ctx.db
        .from('quotes_view')
        .select(LIST_COLUMNS)
        .eq('workspace_id', ctx.workspaceId)
        .in('effective_status', ['sent', 'viewed'])
        .gte('valid_until', today)
        .lte('valid_until', until)
        .order('valid_until'),
    ) as unknown as Partial<QuoteViewRow>[];
    return rows.map(toListItem);
  }

  async find(ctx: WorkspaceContext, id: string): Promise<Quote> {
    const [row, items] = await Promise.all([
      ctx.db.from('quotes_view').select('*').eq('workspace_id', ctx.workspaceId).eq('id', id).single(),
      ctx.db.from('quote_items').select('*').eq('workspace_id', ctx.workspaceId).eq('quote_id', id).order('position'),
    ]);
    return toQuote(unwrap(row), unwrap(items));
  }

  /** Insert (id = null) or update a draft, items replaced, in one transaction. */
  async save(ctx: WorkspaceContext, id: string | null, record: SaveQuoteRecord): Promise<string> {
    const { input, totals, lineTotals } = record;
    return unwrap(
      await ctx.db.rpc('save_quote', {
        p_workspace_id: ctx.workspaceId,
        p_quote_id: id as string, // the function accepts null for a new quote
        p_quote: {
          customer_id: input.customerId,
          title: input.title,
          valid_until: input.validUntil,
          discount_type: input.discountType,
          discount_value: input.discountValue,
          tax_percent: input.taxPercent,
          notes: input.notes ?? '',
          subtotal_minor: totals.subtotalMinor,
          discount_minor: totals.discountMinor,
          tax_minor: totals.taxMinor,
          total_minor: totals.totalMinor,
        },
        p_items: input.items.map((item, index) => ({
          catalog_item_id: item.catalogItemId ?? '',
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          unit_price_minor: item.unitPriceMinor,
          line_total_minor: lineTotals[index],
        })),
      }),
    );
  }

  async send(ctx: WorkspaceContext, id: string, tokenHash: string): Promise<void> {
    unwrap(await ctx.db.rpc('send_quote', { p_workspace_id: ctx.workspaceId, p_quote_id: id, p_token_hash: tokenHash }));
  }

  async duplicate(ctx: WorkspaceContext, id: string, validUntil: string): Promise<string> {
    return unwrap(
      await ctx.db.rpc('duplicate_quote', { p_workspace_id: ctx.workspaceId, p_quote_id: id, p_valid_until: validUntil }),
    );
  }

  async events(ctx: WorkspaceContext, id: string): Promise<QuoteEvent[]> {
    const rows = unwrap(
      await ctx.db
        .from('quote_events')
        .select('id, type, created_at, profiles(full_name)')
        .eq('workspace_id', ctx.workspaceId)
        .eq('quote_id', id)
        .order('created_at', { ascending: false }),
    );
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      actorName: row.profiles?.full_name ?? null,
      createdAt: row.created_at,
    }));
  }
}

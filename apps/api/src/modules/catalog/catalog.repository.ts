import { Injectable } from '@nestjs/common';
import type { CatalogItem, CatalogItemInput, PageMeta } from '@folio/shared';
import { toRange, toSearchPattern } from '../../common/pagination';
import type { WorkspaceContext } from '../../common/request-context';
import type { Database } from '../../supabase/database.types';
import { unwrap } from '../../supabase/db-error';
import type { CatalogQueryDto } from './catalog.dto';

type CatalogRow = Database['public']['Tables']['catalog_items']['Row'];

function toCatalogItem(row: CatalogRow): CatalogItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitPriceMinor: row.unit_price_minor,
    active: row.active,
  };
}

function toRow(input: Partial<CatalogItemInput>) {
  return {
    name: input.name,
    description: input.description,
    unit: input.unit,
    unit_price_minor: input.unitPriceMinor,
    active: input.active,
  };
}

@Injectable()
export class CatalogRepository {
  async list(ctx: WorkspaceContext, query: CatalogQueryDto): Promise<{ items: CatalogItem[]; meta: PageMeta }> {
    const { from, to, page, pageSize } = toRange(query);
    let request = ctx.db
      .from('catalog_items')
      .select('*', { count: 'exact' })
      .eq('workspace_id', ctx.workspaceId)
      .order('active', { ascending: false })
      .order('name')
      .range(from, to);
    if (query.activeOnly) request = request.eq('active', true);
    if (query.search) request = request.ilike('name', toSearchPattern(query.search));
    const { data, count, error } = await request;
    return { items: unwrap({ data, error }).map(toCatalogItem), meta: { page, pageSize, total: count ?? 0 } };
  }

  async create(ctx: WorkspaceContext, input: CatalogItemInput): Promise<CatalogItem> {
    return toCatalogItem(
      unwrap(
        await ctx.db
          .from('catalog_items')
          .insert({ ...toRow(input), name: input.name, unit_price_minor: input.unitPriceMinor, workspace_id: ctx.workspaceId })
          .select('*')
          .single(),
      ),
    );
  }

  async update(ctx: WorkspaceContext, id: string, input: Partial<CatalogItemInput>): Promise<CatalogItem> {
    return toCatalogItem(
      unwrap(
        await ctx.db
          .from('catalog_items')
          .update(toRow(input))
          .eq('workspace_id', ctx.workspaceId)
          .eq('id', id)
          .select('*')
          .single(),
      ),
    );
  }
}

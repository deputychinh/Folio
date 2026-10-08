import { Injectable } from '@nestjs/common';
import type { Customer, CustomerInput, PageMeta } from '@folio/shared';
import { toRange, toSearchPattern } from '../../common/pagination';
import type { WorkspaceContext } from '../../common/request-context';
import type { Database } from '../../supabase/database.types';
import { unwrap } from '../../supabase/db-error';
import type { CustomerQueryDto } from './customer.dto';

type CustomerRow = Database['public']['Tables']['customers']['Row'];

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    archived: row.archived_at !== null,
    createdAt: row.created_at,
  };
}

function toRow(input: Partial<CustomerInput>) {
  return {
    company_name: input.companyName,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone,
    address: input.address,
  };
}

@Injectable()
export class CustomersRepository {
  async list(ctx: WorkspaceContext, query: CustomerQueryDto): Promise<{ items: Customer[]; meta: PageMeta }> {
    const { from, to, page, pageSize } = toRange(query);
    let request = ctx.db
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('workspace_id', ctx.workspaceId)
      .order('company_name')
      .range(from, to);
    if (!query.includeArchived) request = request.is('archived_at', null);
    if (query.search) {
      const pattern = toSearchPattern(query.search);
      request = request.or(`company_name.ilike.${pattern},contact_name.ilike.${pattern},email.ilike.${pattern}`);
    }
    const { data, count, error } = await request;
    const rows = unwrap({ data, error });
    return { items: rows.map(toCustomer), meta: { page, pageSize, total: count ?? 0 } };
  }

  async find(ctx: WorkspaceContext, id: string): Promise<Customer> {
    return toCustomer(
      unwrap(await ctx.db.from('customers').select('*').eq('workspace_id', ctx.workspaceId).eq('id', id).single()),
    );
  }

  async create(ctx: WorkspaceContext, input: CustomerInput): Promise<Customer> {
    return toCustomer(
      unwrap(
        await ctx.db
          .from('customers')
          .insert({ ...toRow(input), company_name: input.companyName, workspace_id: ctx.workspaceId })
          .select('*')
          .single(),
      ),
    );
  }

  async update(ctx: WorkspaceContext, id: string, input: Partial<CustomerInput>): Promise<Customer> {
    return toCustomer(
      unwrap(
        await ctx.db
          .from('customers')
          .update(toRow(input))
          .eq('workspace_id', ctx.workspaceId)
          .eq('id', id)
          .select('*')
          .single(),
      ),
    );
  }

  /** Customers are archived, never deleted, because quotes point to them. */
  async setArchived(ctx: WorkspaceContext, id: string, archived: boolean): Promise<Customer> {
    return toCustomer(
      unwrap(
        await ctx.db
          .from('customers')
          .update({ archived_at: archived ? new Date().toISOString() : null })
          .eq('workspace_id', ctx.workspaceId)
          .eq('id', id)
          .select('*')
          .single(),
      ),
    );
  }
}

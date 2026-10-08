import { Injectable } from '@nestjs/common';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, Workspace } from '@folio/shared';
import type { UserContext, WorkspaceContext } from '../../common/request-context';
import type { Database } from '../../supabase/database.types';
import { unwrap } from '../../supabase/db-error';

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row'];

const COLUMNS = 'id, name, currency, tax_percent, brand_accent, logo_path';

function toWorkspace(row: Pick<WorkspaceRow, 'id' | 'name' | 'currency' | 'tax_percent' | 'brand_accent' | 'logo_path'>): Workspace {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    taxPercent: Number(row.tax_percent),
    brandAccent: row.brand_accent,
    logoUrl: row.logo_path,
  };
}

@Injectable()
export class WorkspacesRepository {
  async create(ctx: UserContext, input: CreateWorkspaceInput): Promise<string> {
    return unwrap(
      await ctx.db.rpc('create_workspace', {
        p_name: input.name,
        p_currency: input.currency,
        p_tax_percent: input.taxPercent,
      }),
    );
  }

  async find(ctx: UserContext, id: string): Promise<Workspace> {
    return toWorkspace(unwrap(await ctx.db.from('workspaces').select(COLUMNS).eq('id', id).single()));
  }

  async update(ctx: WorkspaceContext, input: UpdateWorkspaceInput): Promise<Workspace> {
    const row = unwrap(
      await ctx.db
        .from('workspaces')
        .update({
          name: input.name,
          currency: input.currency,
          tax_percent: input.taxPercent,
          brand_accent: input.brandAccent,
        })
        .eq('id', ctx.workspaceId)
        .select(COLUMNS)
        .single(),
    );
    return toWorkspace(row);
  }
}

import { Injectable } from '@nestjs/common';
import type { Me } from '@folio/shared';
import type { UserContext } from '../../common/request-context';
import { unwrap } from '../../supabase/db-error';

@Injectable()
export class MeRepository {
  async find(ctx: UserContext): Promise<Me> {
    const profile = unwrap(
      await ctx.db.from('profiles').select('id, email, full_name').eq('id', ctx.userId).single(),
    );
    const memberships = unwrap(
      await ctx.db
        .from('workspace_members')
        .select('role, workspaces(id, name)')
        .eq('user_id', ctx.userId)
        .order('created_at'),
    );
    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      workspaces: memberships.flatMap((m) => (m.workspaces ? [{ id: m.workspaces.id, name: m.workspaces.name, role: m.role }] : [])),
    };
  }
}

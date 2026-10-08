import { Injectable } from '@nestjs/common';
import { InviteStatus, type CreateInviteInput, type Invite, type Member } from '@folio/shared';
import type { UserContext, WorkspaceContext } from '../../common/request-context';
import type { Database } from '../../supabase/database.types';
import { unwrap } from '../../supabase/db-error';

type InviteRow = Database['public']['Tables']['invites']['Row'];

const INVITE_COLUMNS = 'id, email, role, status, expires_at';

function toInvite(row: Pick<InviteRow, 'id' | 'email' | 'role' | 'status' | 'expires_at'>): Invite {
  return { id: row.id, email: row.email, role: row.role, status: row.status, expiresAt: row.expires_at };
}

@Injectable()
export class MembersRepository {
  async list(ctx: WorkspaceContext): Promise<Member[]> {
    const rows = unwrap(
      await ctx.db
        .from('workspace_members')
        .select('user_id, role, created_at, profiles(email, full_name)')
        .eq('workspace_id', ctx.workspaceId)
        .order('created_at'),
    );
    return rows.map((row) => ({
      userId: row.user_id,
      role: row.role,
      joinedAt: row.created_at,
      email: row.profiles?.email ?? '',
      fullName: row.profiles?.full_name ?? '',
    }));
  }

  async updateRole(ctx: WorkspaceContext, userId: string, role: Member['role']): Promise<void> {
    unwrap(await ctx.db.rpc('update_member_role', { p_workspace_id: ctx.workspaceId, p_user_id: userId, p_role: role }));
  }

  async remove(ctx: WorkspaceContext, userId: string): Promise<void> {
    unwrap(await ctx.db.rpc('remove_member', { p_workspace_id: ctx.workspaceId, p_user_id: userId }));
  }

  async listPendingInvites(ctx: WorkspaceContext): Promise<Invite[]> {
    const rows = unwrap(
      await ctx.db
        .from('invites')
        .select(INVITE_COLUMNS)
        .eq('workspace_id', ctx.workspaceId)
        .eq('status', InviteStatus.PENDING)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }),
    );
    return rows.map(toInvite);
  }

  async createInvite(ctx: WorkspaceContext, input: CreateInviteInput, tokenHash: string, expiresAt: string): Promise<Invite> {
    const row = unwrap(
      await ctx.db
        .from('invites')
        .insert({
          workspace_id: ctx.workspaceId,
          email: input.email.toLowerCase(),
          role: input.role,
          token_hash: tokenHash,
          invited_by: ctx.userId,
          expires_at: expiresAt,
        })
        .select(INVITE_COLUMNS)
        .single(),
    );
    return toInvite(row);
  }

  async revokeInvite(ctx: WorkspaceContext, id: string): Promise<void> {
    unwrap(
      await ctx.db
        .from('invites')
        .update({ status: InviteStatus.REVOKED })
        .eq('workspace_id', ctx.workspaceId)
        .eq('id', id)
        .select('id')
        .single(),
    );
  }

  async acceptInvite(ctx: UserContext, tokenHash: string): Promise<string> {
    return unwrap(await ctx.db.rpc('accept_invite', { p_token_hash: tokenHash }));
  }
}

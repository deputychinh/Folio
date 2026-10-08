import { Inject, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  INVITE_VALID_DAYS,
  type CreatedInvite,
  type CreateInviteInput,
  type Invite,
  type Member,
  type WorkspaceRole,
} from '@folio/shared';
import { AppError } from '../../common/app-error';
import type { UserContext, WorkspaceContext } from '../../common/request-context';
import { createToken, hashToken } from '../../common/token';
import { APP_URL } from '../../config/app-url';
import { MembersRepository } from './members.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MembersService {
  constructor(
    private readonly repository: MembersRepository,
    @Inject(APP_URL) private readonly appUrl: string,
  ) {}

  list(ctx: WorkspaceContext): Promise<Member[]> {
    return this.repository.list(ctx);
  }

  listInvites(ctx: WorkspaceContext): Promise<Invite[]> {
    return this.repository.listPendingInvites(ctx);
  }

  /** The last-owner and owner-only rules are enforced in the database (check_member_change). */
  async updateRole(ctx: WorkspaceContext, userId: string, role: WorkspaceRole): Promise<Member[]> {
    await this.repository.updateRole(ctx, userId, role);
    return this.repository.list(ctx);
  }

  async remove(ctx: WorkspaceContext, userId: string): Promise<void> {
    if (userId === ctx.userId) throw new AppError(ErrorCode.CONFLICT, 'You cannot remove yourself.');
    await this.repository.remove(ctx, userId);
  }

  /** The invite link is returned once; the owner copies it to the new teammate. */
  async invite(ctx: WorkspaceContext, input: CreateInviteInput): Promise<CreatedInvite> {
    const members = await this.repository.list(ctx);
    if (members.some((member) => member.email.toLowerCase() === input.email.toLowerCase())) {
      throw new AppError(ErrorCode.CONFLICT, 'This person is already in the workspace.');
    }
    const { token, hash } = createToken();
    const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * DAY_MS).toISOString();
    const invite = await this.repository.createInvite(ctx, input, hash, expiresAt);
    return { ...invite, inviteUrl: `${this.appUrl}/invite/${token}` };
  }

  revokeInvite(ctx: WorkspaceContext, id: string): Promise<void> {
    return this.repository.revokeInvite(ctx, id);
  }

  async acceptInvite(ctx: UserContext, token: string): Promise<{ workspaceId: string }> {
    return { workspaceId: await this.repository.acceptInvite(ctx, hashToken(token)) };
  }
}

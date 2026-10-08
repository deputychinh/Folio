import { ErrorCode, WorkspaceRole } from '@folio/shared';
import type { MembersRepository } from '../../src/modules/members/members.repository';
import { MembersService } from '../../src/modules/members/members.service';
import { ctx } from './fakes';

function setup() {
  const repository = {
    list: jest.fn().mockResolvedValue([
      { userId: 'user-1', email: 'owner@example.com', fullName: 'Owner', role: WorkspaceRole.OWNER, joinedAt: '' },
    ]),
    createInvite: jest.fn().mockImplementation(async (_ctx, input) => ({ id: 'inv-1', ...input, status: 'pending', expiresAt: '' })),
    remove: jest.fn(),
  };
  return { service: new MembersService(repository as unknown as MembersRepository, 'https://app.example'), repository };
}

describe('MembersService', () => {
  it('returns an invite link and stores only the hash', async () => {
    const { service, repository } = setup();
    const invite = await service.invite(ctx, { email: 'new@example.com', role: WorkspaceRole.MEMBER });

    expect(invite.inviteUrl).toMatch(/^https:\/\/app\.example\/invite\/[A-Za-z0-9_-]{43}$/);
    expect(repository.createInvite.mock.calls[0][2]).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses to invite someone who is already a member (case-insensitive)', async () => {
    const { service } = setup();
    await expect(service.invite(ctx, { email: 'OWNER@example.com', role: WorkspaceRole.MEMBER })).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
    });
  });

  it('refuses to remove yourself', async () => {
    const { service, repository } = setup();
    await expect(service.remove(ctx, ctx.userId)).rejects.toMatchObject({ code: ErrorCode.CONFLICT });
    expect(repository.remove).not.toHaveBeenCalled();
  });
});

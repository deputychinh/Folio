import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { MANAGER_ROLES, type CreatedInvite, type Invite, type Member } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Ctx, type UserContext, type WorkspaceContext } from '../../common/request-context';
import { CreateInviteDto, UpdateMemberDto } from './member.dto';
import { MembersService } from './members.service';

@Controller('members')
@UseGuards(AuthGuard, WorkspaceGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(@Ctx() ctx: WorkspaceContext): Promise<Member[]> {
    return this.members.list(ctx);
  }

  @Get('invites')
  @Roles(...MANAGER_ROLES)
  invites(@Ctx() ctx: WorkspaceContext): Promise<Invite[]> {
    return this.members.listInvites(ctx);
  }

  @Post('invites')
  @Roles(...MANAGER_ROLES)
  invite(@Ctx() ctx: WorkspaceContext, @Body() body: CreateInviteDto): Promise<CreatedInvite> {
    return this.members.invite(ctx, body);
  }

  @Delete('invites/:id')
  @HttpCode(204)
  @Roles(...MANAGER_ROLES)
  revoke(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.members.revokeInvite(ctx, id);
  }

  @Patch(':userId')
  @Roles(...MANAGER_ROLES)
  updateRole(
    @Ctx() ctx: WorkspaceContext,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateMemberDto,
  ): Promise<Member[]> {
    return this.members.updateRole(ctx, userId, body.role);
  }

  @Delete(':userId')
  @HttpCode(204)
  @Roles(...MANAGER_ROLES)
  remove(@Ctx() ctx: WorkspaceContext, @Param('userId', ParseUUIDPipe) userId: string): Promise<void> {
    return this.members.remove(ctx, userId);
  }
}

/** Accepting an invite needs a login but no workspace yet. */
@Controller('invites')
@UseGuards(AuthGuard)
export class InvitesController {
  constructor(private readonly members: MembersService) {}

  @Post(':token/accept')
  @HttpCode(200)
  accept(@Ctx() ctx: UserContext, @Param('token') token: string): Promise<{ workspaceId: string }> {
    return this.members.acceptInvite(ctx, token);
  }
}

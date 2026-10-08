import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { MANAGER_ROLES, type Workspace } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Ctx, type UserContext, type WorkspaceContext } from '../../common/request-context';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './workspace.dto';
import { WorkspacesRepository } from './workspaces.repository';

@Controller('workspaces')
@UseGuards(AuthGuard)
export class WorkspacesController {
  constructor(private readonly repository: WorkspacesRepository) {}

  /** Onboarding: the caller becomes OWNER of the new workspace. */
  @Post()
  async create(@Ctx() ctx: UserContext, @Body() body: CreateWorkspaceDto): Promise<Workspace> {
    const id = await this.repository.create(ctx, body);
    return this.repository.find(ctx, id);
  }

  @Get('current')
  @UseGuards(WorkspaceGuard)
  current(@Ctx() ctx: WorkspaceContext): Promise<Workspace> {
    return this.repository.find(ctx, ctx.workspaceId);
  }

  @Patch('current')
  @UseGuards(WorkspaceGuard)
  @Roles(...MANAGER_ROLES)
  update(@Ctx() ctx: WorkspaceContext, @Body() body: UpdateWorkspaceDto): Promise<Workspace> {
    return this.repository.update(ctx, body);
  }
}

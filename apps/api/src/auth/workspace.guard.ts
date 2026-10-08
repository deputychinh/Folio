import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, WORKSPACE_HEADER, type WorkspaceRole } from '@folio/shared';
import { AppError } from '../common/app-error';
import type { AppRequest } from '../common/request-context';
import { ROLES_KEY } from './roles.decorator';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Runs after AuthGuard. Reads the workspace from the x-workspace-id header,
 * checks the caller is a member and has one of the @Roles (if any).
 * RLS checks membership again on every query.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>();
    const user = req.user;
    if (!user) throw new AppError(ErrorCode.UNAUTHORIZED);

    const workspaceId = req.header(WORKSPACE_HEADER);
    if (!workspaceId || !UUID.test(workspaceId)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Header ${WORKSPACE_HEADER} is missing or not valid.`);
    }

    const { data } = await user.db
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.userId)
      .maybeSingle();
    if (!data) throw new AppError(ErrorCode.FORBIDDEN);

    const allowed = this.reflector.getAllAndOverride<WorkspaceRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowed && !allowed.includes(data.role)) throw new AppError(ErrorCode.FORBIDDEN);

    req.workspace = { ...user, workspaceId, role: data.role };
    return true;
  }
}

import { SetMetadata } from '@nestjs/common';
import type { WorkspaceRole } from '@folio/shared';

export const ROLES_KEY = 'roles';

/** Limit a route to some workspace roles. Without it, any member may call it. */
export const Roles = (...roles: WorkspaceRole[]) => SetMetadata(ROLES_KEY, roles);

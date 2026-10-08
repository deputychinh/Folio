import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { WorkspaceRole } from '@folio/shared';
import type { Request } from 'express';
import type { Db } from '../supabase/supabase.service';

/** What the guards learned about the caller. Passed explicitly to services. */
export interface UserContext {
  userId: string;
  email: string;
  /** Supabase client acting as this user, so RLS applies to every query. */
  db: Db;
}

export interface WorkspaceContext extends UserContext {
  workspaceId: string;
  role: WorkspaceRole;
}

export interface AppRequest extends Request {
  requestId: string;
  user?: UserContext;
  workspace?: WorkspaceContext;
}

/** @Ctx() in a controller gives the workspace context if there is one, otherwise the user context. */
export const Ctx = createParamDecorator((_: unknown, host: ExecutionContext) => {
  const req = host.switchToHttp().getRequest<AppRequest>();
  return req.workspace ?? req.user;
});

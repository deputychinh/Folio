import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ErrorCode } from '@folio/shared';
import { AppError } from '../common/app-error';
import type { AppRequest } from '../common/request-context';
import { SupabaseService } from '../supabase/supabase.service';

/** Requires a valid Supabase access token: Authorization: Bearer <jwt>. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AppRequest>();
    const token = req.header('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new AppError(ErrorCode.UNAUTHORIZED);

    const claims = await this.supabase.verifyToken(token);
    if (!claims) throw new AppError(ErrorCode.UNAUTHORIZED);

    req.user = { userId: claims.sub, email: claims.email, db: this.supabase.forUser(token) };
    return true;
  }
}

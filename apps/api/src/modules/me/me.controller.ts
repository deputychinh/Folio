import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Me } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { Ctx, type UserContext } from '../../common/request-context';
import { MeRepository } from './me.repository';

/** No business rules here, so the controller reads the repository directly. */
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly repository: MeRepository) {}

  @Get()
  me(@Ctx() ctx: UserContext): Promise<Me> {
    return this.repository.find(ctx);
  }
}

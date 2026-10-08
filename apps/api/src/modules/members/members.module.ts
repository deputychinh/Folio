import { Module } from '@nestjs/common';
import { InvitesController, MembersController } from './members.controller';
import { MembersRepository } from './members.repository';
import { MembersService } from './members.service';

@Module({ controllers: [MembersController, InvitesController], providers: [MembersService, MembersRepository] })
export class MembersModule {}

import { Module } from '@nestjs/common';
import { PublicQuotesController } from './public-quotes.controller';
import { PublicQuotesRepository } from './public-quotes.repository';
import { PublicQuotesService } from './public-quotes.service';

@Module({ controllers: [PublicQuotesController], providers: [PublicQuotesService, PublicQuotesRepository] })
export class PublicQuotesModule {}

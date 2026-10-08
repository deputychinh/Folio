import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesRepository } from './quotes.repository';
import { QuotesService } from './quotes.service';

@Module({
  controllers: [QuotesController],
  providers: [QuotesService, QuotesRepository],
  exports: [QuotesRepository],
})
export class QuotesModule {}

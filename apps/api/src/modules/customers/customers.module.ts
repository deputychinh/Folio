import { Module } from '@nestjs/common';
import { QuotesModule } from '../quotes/quotes.module';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';

@Module({ imports: [QuotesModule], controllers: [CustomersController], providers: [CustomersRepository] })
export class CustomersModule {}

import { Module } from '@nestjs/common';
import { QuotesModule } from '../quotes/quotes.module';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

@Module({ imports: [QuotesModule], controllers: [DashboardController], providers: [DashboardService, DashboardRepository] })
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { MeModule } from './modules/me/me.module';
import { MembersModule } from './modules/members/members.module';
import { PublicQuotesModule } from './modules/public-quotes/public-quotes.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    HealthModule,
    MeModule,
    WorkspacesModule,
    MembersModule,
    CustomersModule,
    CatalogModule,
    QuotesModule,
    PublicQuotesModule,
    DashboardModule,
  ],
})
export class AppModule {}

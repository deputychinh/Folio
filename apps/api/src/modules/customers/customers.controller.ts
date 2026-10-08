import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { Customer, CustomerDetail } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Paged } from '../../common/pagination';
import { Ctx, type WorkspaceContext } from '../../common/request-context';
import { QuotesRepository } from '../quotes/quotes.repository';
import { CustomerDto, CustomerQueryDto } from './customer.dto';
import { CustomersRepository } from './customers.repository';

@Controller('customers')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CustomersController {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly quotes: QuotesRepository,
  ) {}

  @Get()
  async list(@Ctx() ctx: WorkspaceContext, @Query() query: CustomerQueryDto): Promise<Paged<Customer>> {
    const { items, meta } = await this.customers.list(ctx, query);
    return new Paged(items, meta);
  }

  @Post()
  create(@Ctx() ctx: WorkspaceContext, @Body() body: CustomerDto): Promise<Customer> {
    return this.customers.create(ctx, body);
  }

  @Get(':id')
  async detail(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<CustomerDetail> {
    const [customer, quotes] = await Promise.all([
      this.customers.find(ctx, id),
      this.quotes.list(ctx, { customerId: id, pageSize: 100 }),
    ]);
    return { ...customer, quotes: quotes.items };
  }

  @Patch(':id')
  update(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string, @Body() body: CustomerDto): Promise<Customer> {
    return this.customers.update(ctx, id, body);
  }

  @Delete(':id')
  archive(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customers.setArchived(ctx, id, true);
  }

  @Post(':id/restore')
  restore(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customers.setArchived(ctx, id, false);
  }
}

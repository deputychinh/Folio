import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { Quote, QuoteEvent, QuoteListItem, SentQuote } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Paged } from '../../common/pagination';
import { Ctx, type WorkspaceContext } from '../../common/request-context';
import { QuoteQueryDto, SaveQuoteDto } from './quote.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
@UseGuards(AuthGuard, WorkspaceGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  async list(@Ctx() ctx: WorkspaceContext, @Query() query: QuoteQueryDto): Promise<Paged<QuoteListItem>> {
    const { items, meta } = await this.quotes.list(ctx, query);
    return new Paged(items, meta);
  }

  @Post()
  create(@Ctx() ctx: WorkspaceContext, @Body() body: SaveQuoteDto): Promise<Quote> {
    return this.quotes.create(ctx, body);
  }

  @Get(':id')
  get(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<Quote> {
    return this.quotes.get(ctx, id);
  }

  @Put(':id')
  update(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string, @Body() body: SaveQuoteDto): Promise<Quote> {
    return this.quotes.update(ctx, id, body);
  }

  @Post(':id/send')
  @HttpCode(200)
  send(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<SentQuote> {
    return this.quotes.send(ctx, id);
  }

  @Post(':id/duplicate')
  duplicate(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<Quote> {
    return this.quotes.duplicate(ctx, id);
  }

  @Get(':id/events')
  events(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string): Promise<QuoteEvent[]> {
    return this.quotes.events(ctx, id);
  }
}

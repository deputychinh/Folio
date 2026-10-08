import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { CatalogItem } from '@folio/shared';
import { AuthGuard } from '../../auth/auth.guard';
import { WorkspaceGuard } from '../../auth/workspace.guard';
import { Paged } from '../../common/pagination';
import { Ctx, type WorkspaceContext } from '../../common/request-context';
import { CatalogItemDto, CatalogQueryDto } from './catalog.dto';
import { CatalogRepository } from './catalog.repository';

@Controller('catalog')
@UseGuards(AuthGuard, WorkspaceGuard)
export class CatalogController {
  constructor(private readonly repository: CatalogRepository) {}

  @Get()
  async list(@Ctx() ctx: WorkspaceContext, @Query() query: CatalogQueryDto): Promise<Paged<CatalogItem>> {
    const { items, meta } = await this.repository.list(ctx, query);
    return new Paged(items, meta);
  }

  @Post()
  create(@Ctx() ctx: WorkspaceContext, @Body() body: CatalogItemDto): Promise<CatalogItem> {
    return this.repository.create(ctx, body);
  }

  @Patch(':id')
  update(@Ctx() ctx: WorkspaceContext, @Param('id', ParseUUIDPipe) id: string, @Body() body: CatalogItemDto): Promise<CatalogItem> {
    return this.repository.update(ctx, id, body);
  }
}

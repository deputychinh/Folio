import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX, SEARCH_MAX, type PageMeta, type PageQuery } from '@folio/shared';

export class PageQueryDto implements PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(PAGE_SIZE_MAX)
  pageSize?: number;

  @IsOptional() @IsString() @MaxLength(SEARCH_MAX)
  search?: string;
}

/** A list result. The response interceptor turns it into { data, meta }. */
export class Paged<T> {
  constructor(
    readonly items: T[],
    readonly meta: PageMeta,
  ) {}
}

/** page/pageSize → the inclusive row range Supabase expects. */
export function toRange(query: PageQuery): { from: number; to: number; page: number; pageSize: number } {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1, page, pageSize };
}

/** Escape the characters that mean something inside a PostgREST ilike filter. */
export function toSearchPattern(search: string): string {
  return `%${search.trim().replace(/[%_\\,()]/g, (char) => `\\${char}`)}%`;
}

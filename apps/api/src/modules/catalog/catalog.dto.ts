import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { CatalogUnit, enumValues, NAME_MAX, UNIT_PRICE_MINOR_MAX, type CatalogItemInput } from '@folio/shared';
import { PageQueryDto } from '../../common/pagination';

export class CatalogItemDto implements CatalogItemInput {
  @IsString() @MinLength(1) @MaxLength(NAME_MAX)
  name: string;

  @IsOptional() @IsString() @MaxLength(500)
  description?: string;

  @IsIn(enumValues(CatalogUnit))
  unit: CatalogUnit;

  @Type(() => Number) @IsInt() @Min(0) @Max(UNIT_PRICE_MINOR_MAX)
  unitPriceMinor: number;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class CatalogQueryDto extends PageQueryDto {
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  activeOnly?: boolean;
}

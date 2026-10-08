import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CatalogUnit,
  DiscountType,
  enumValues,
  NAME_MAX,
  QUANTITY_MAX,
  QUOTE_ITEMS_MAX,
  QUOTE_NOTES_MAX,
  QUOTE_TITLE_MAX,
  QuoteSort,
  QuoteStatus,
  TAX_PERCENT_MAX,
  UNIT_PRICE_MINOR_MAX,
  type QuoteItemInput,
  type QuoteQuery,
  type SaveQuoteInput,
} from '@folio/shared';
import { PageQueryDto } from '../../common/pagination';

export class QuoteItemDto implements QuoteItemInput {
  @IsOptional() @IsUUID()
  catalogItemId?: string | null;

  @IsString() @MinLength(1) @MaxLength(NAME_MAX)
  name: string;

  @IsIn(enumValues(CatalogUnit))
  unit: CatalogUnit;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(QUANTITY_MAX)
  quantity: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(UNIT_PRICE_MINOR_MAX)
  unitPriceMinor: number;
}

export class SaveQuoteDto implements SaveQuoteInput {
  @IsUUID()
  customerId: string;

  @IsString() @MinLength(1) @MaxLength(QUOTE_TITLE_MAX)
  title: string;

  @IsISO8601({ strict: true })
  validUntil: string;

  @ValidateNested({ each: true }) @Type(() => QuoteItemDto) @ArrayMinSize(0) @ArrayMaxSize(QUOTE_ITEMS_MAX)
  items: QuoteItemDto[];

  @IsIn(enumValues(DiscountType))
  discountType: DiscountType;

  /** Percent, or minor units for AMOUNT. The upper bound for percent is checked in the service. */
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  discountValue: number;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(TAX_PERCENT_MAX)
  taxPercent: number;

  @IsOptional() @IsString() @MaxLength(QUOTE_NOTES_MAX)
  notes?: string;
}

export class QuoteQueryDto extends PageQueryDto implements QuoteQuery {
  @IsOptional() @IsIn(enumValues(QuoteStatus))
  status?: QuoteStatus;

  @IsOptional() @IsUUID()
  customerId?: string;

  @IsOptional() @IsIn(enumValues(QuoteSort))
  sort?: QuoteSort;
}

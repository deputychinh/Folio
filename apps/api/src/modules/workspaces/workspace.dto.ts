import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import {
  Currency,
  enumValues,
  NAME_MAX,
  TAX_PERCENT_MAX,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from '@folio/shared';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class CreateWorkspaceDto implements CreateWorkspaceInput {
  @IsString() @MinLength(1) @MaxLength(NAME_MAX)
  name: string;

  @IsIn(enumValues(Currency))
  currency: Currency;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(TAX_PERCENT_MAX)
  taxPercent: number;
}

export class UpdateWorkspaceDto implements UpdateWorkspaceInput {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(NAME_MAX)
  name?: string;

  @IsOptional() @IsIn(enumValues(Currency))
  currency?: Currency;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(TAX_PERCENT_MAX)
  taxPercent?: number;

  @IsOptional() @Matches(HEX_COLOR)
  brandAccent?: string | null;
}

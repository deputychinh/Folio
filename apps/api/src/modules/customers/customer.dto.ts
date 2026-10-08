import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { NAME_MAX, type CustomerInput } from '@folio/shared';
import { PageQueryDto } from '../../common/pagination';

const TEXT_MAX = 300;

export class CustomerDto implements CustomerInput {
  @IsString() @MinLength(1) @MaxLength(NAME_MAX)
  companyName: string;

  @IsOptional() @IsString() @MaxLength(NAME_MAX)
  contactName?: string;

  @IsOptional() @ValidateIf((_, value) => value !== '') @IsEmail() @MaxLength(NAME_MAX)
  email?: string;

  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(TEXT_MAX)
  address?: string;
}

export class CustomerQueryDto extends PageQueryDto {
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()
  includeArchived?: boolean;
}

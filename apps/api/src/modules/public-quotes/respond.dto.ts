import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DECLINE_REASON_MAX, NAME_MAX, type RespondQuoteInput } from '@folio/shared';

export class RespondQuoteDto implements RespondQuoteInput {
  @IsBoolean()
  accept: boolean;

  @IsString() @MinLength(2) @MaxLength(NAME_MAX)
  clientName: string;

  @IsOptional() @IsString() @MaxLength(DECLINE_REASON_MAX)
  declineReason?: string;
}

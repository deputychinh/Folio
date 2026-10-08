import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { PublicQuote } from '@folio/shared';
import type { AppRequest } from '../../common/request-context';
import { PublicQuotesService } from './public-quotes.service';
import { RespondQuoteDto } from './respond.dto';

/** No login: the client opens the link they were given. Rate-limited per IP. */
@Controller('public/quotes')
export class PublicQuotesController {
  constructor(private readonly quotes: PublicQuotesService) {}

  @Get(':token')
  open(@Param('token') token: string, @Req() req: AppRequest): Promise<PublicQuote> {
    return this.quotes.open(token, clientIp(req));
  }

  @Post(':token/respond')
  @HttpCode(200)
  respond(@Param('token') token: string, @Body() body: RespondQuoteDto, @Req() req: AppRequest): Promise<PublicQuote> {
    return this.quotes.respond(token, body, clientIp(req));
  }
}

/** Vercel puts the real client IP first in x-forwarded-for. */
function clientIp(req: AppRequest): string {
  const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.ip || 'unknown';
}

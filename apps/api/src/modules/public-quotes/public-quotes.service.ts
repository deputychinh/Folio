import { Injectable } from '@nestjs/common';
import { ErrorCode, PUBLIC_RATE_LIMIT, type PublicQuote, type RespondQuoteInput } from '@folio/shared';
import { AppError } from '../../common/app-error';
import { hashToken } from '../../common/token';
import { PublicQuotesRepository } from './public-quotes.repository';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

@Injectable()
export class PublicQuotesService {
  constructor(private readonly repository: PublicQuotesRepository) {}

  async open(token: string, clientIp: string): Promise<PublicQuote> {
    await this.limit(clientIp);
    return this.repository.open(this.hash(token));
  }

  async respond(token: string, input: RespondQuoteInput, clientIp: string): Promise<PublicQuote> {
    await this.limit(clientIp);
    const hash = this.hash(token);
    await this.repository.respond(hash, input);
    return this.repository.open(hash);
  }

  private hash(token: string): string {
    if (!TOKEN_PATTERN.test(token)) throw new AppError(ErrorCode.NOT_FOUND);
    return hashToken(token);
  }

  private async limit(clientIp: string): Promise<void> {
    const allowed = await this.repository.allow(`public:${clientIp}`, PUBLIC_RATE_LIMIT.requests, PUBLIC_RATE_LIMIT.windowSeconds);
    if (!allowed) throw new AppError(ErrorCode.RATE_LIMITED, undefined, { retryAfterSeconds: PUBLIC_RATE_LIMIT.windowSeconds });
  }
}

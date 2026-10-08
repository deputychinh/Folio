import { Inject, Injectable } from '@nestjs/common';
import {
  addDays,
  calcLineTotal,
  calcQuoteTotals,
  DiscountType,
  DISCOUNT_PERCENT_MAX,
  ErrorCode,
  isEditable,
  isOpen,
  QuoteStatus,
  QUOTE_VALID_DAYS_DEFAULT,
  type PageMeta,
  type Quote,
  type QuoteEvent,
  type QuoteListItem,
  type QuoteQuery,
  type SaveQuoteInput,
  type SentQuote,
} from '@folio/shared';
import { AppError } from '../../common/app-error';
import { today } from '../../common/clock';
import type { WorkspaceContext } from '../../common/request-context';
import { createToken } from '../../common/token';
import { APP_URL } from '../../config/app-url';
import { QuotesRepository } from './quotes.repository';

@Injectable()
export class QuotesService {
  constructor(
    private readonly repository: QuotesRepository,
    @Inject(APP_URL) private readonly appUrl: string,
  ) {}

  list(ctx: WorkspaceContext, query: QuoteQuery): Promise<{ items: QuoteListItem[]; meta: PageMeta }> {
    return this.repository.list(ctx, query);
  }

  get(ctx: WorkspaceContext, id: string): Promise<Quote> {
    return this.repository.find(ctx, id);
  }

  events(ctx: WorkspaceContext, id: string): Promise<QuoteEvent[]> {
    return this.repository.events(ctx, id);
  }

  async create(ctx: WorkspaceContext, input: SaveQuoteInput): Promise<Quote> {
    const id = await this.repository.save(ctx, null, this.prepare(input));
    return this.repository.find(ctx, id);
  }

  async update(ctx: WorkspaceContext, id: string, input: SaveQuoteInput): Promise<Quote> {
    const current = await this.repository.find(ctx, id);
    if (!isEditable(current.status)) throw new AppError(ErrorCode.INVALID_TRANSITION, 'Only draft quotes can be edited.');
    await this.repository.save(ctx, id, this.prepare(input));
    return this.repository.find(ctx, id);
  }

  /**
   * DRAFT → SENT and a new share link. Sending an open quote again replaces the
   * link. The token is returned once; only its hash is stored.
   */
  async send(ctx: WorkspaceContext, id: string): Promise<SentQuote> {
    const current = await this.repository.find(ctx, id);
    if (current.status === QuoteStatus.EXPIRED) throw new AppError(ErrorCode.QUOTE_EXPIRED);
    if (!isEditable(current.status) && !isOpen(current.status)) throw new AppError(ErrorCode.INVALID_TRANSITION);
    if (current.items.length === 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Add at least one line item before sending.');
    }

    const { token, hash } = createToken();
    await this.repository.send(ctx, id, hash);
    return { quote: await this.repository.find(ctx, id), shareUrl: `${this.appUrl}/q/${token}` };
  }

  async duplicate(ctx: WorkspaceContext, id: string): Promise<Quote> {
    const newId = await this.repository.duplicate(ctx, id, addDays(today(), QUOTE_VALID_DAYS_DEFAULT));
    return this.repository.find(ctx, newId);
  }

  /** Rules the DTO cannot express, then the totals — computed here, never taken from the browser. */
  private prepare(input: SaveQuoteInput) {
    if (input.discountType === DiscountType.PERCENT && input.discountValue > DISCOUNT_PERCENT_MAX) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `A percent discount cannot be more than ${DISCOUNT_PERCENT_MAX}%.`);
    }
    if (input.validUntil < today()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'The valid-until date cannot be in the past.');
    }
    const totals = calcQuoteTotals(
      input.items,
      { type: input.discountType, value: input.discountValue },
      input.taxPercent,
    );
    return { input, totals, lineTotals: input.items.map(calcLineTotal) };
  }
}

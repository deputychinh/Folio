// The quote state machine. The API checks it before every status change,
// the UI reads it to decide which buttons to show, and the Postgres functions
// check it again as the last line of defence.

import { QuoteStatus } from './enums';

export const QUOTE_TRANSITIONS: Record<QuoteStatus, readonly QuoteStatus[]> = {
  [QuoteStatus.DRAFT]: [QuoteStatus.SENT],
  [QuoteStatus.SENT]: [QuoteStatus.VIEWED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  [QuoteStatus.VIEWED]: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]: [],
  [QuoteStatus.DECLINED]: [],
  [QuoteStatus.EXPIRED]: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from].includes(to);
}

export function isEditable(status: QuoteStatus): boolean {
  return status === QuoteStatus.DRAFT;
}

export function isFinal(status: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[status].length === 0;
}

/** Statuses waiting for the client's answer. */
export function isOpen(status: QuoteStatus): boolean {
  return status === QuoteStatus.SENT || status === QuoteStatus.VIEWED;
}

/**
 * The status to show today. A sent quote whose valid-until date has passed is
 * EXPIRED even if no job has written that yet.
 * @param validUntil ISO date, e.g. "2026-10-31"
 * @param today ISO date in the same form
 */
export function effectiveStatus(status: QuoteStatus, validUntil: string, today: string): QuoteStatus {
  return isOpen(status) && validUntil < today ? QuoteStatus.EXPIRED : status;
}

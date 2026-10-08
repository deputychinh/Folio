import { describe, expect, it } from 'vitest';
import { QuoteStatus, enumValues } from '../src/enums';
import { canTransition, effectiveStatus, isEditable, isFinal, isOpen } from '../src/quote-status';

const S = QuoteStatus;
const allowed: Array<[QuoteStatus, QuoteStatus]> = [
  [S.DRAFT, S.SENT],
  [S.SENT, S.VIEWED],
  [S.SENT, S.ACCEPTED],
  [S.SENT, S.DECLINED],
  [S.SENT, S.EXPIRED],
  [S.VIEWED, S.ACCEPTED],
  [S.VIEWED, S.DECLINED],
  [S.VIEWED, S.EXPIRED],
];

describe('canTransition', () => {
  const statuses = enumValues(QuoteStatus);
  for (const from of statuses) {
    for (const to of statuses) {
      const expected = allowed.some(([a, b]) => a === from && b === to);
      it(`${from} → ${to} is ${expected ? 'allowed' : 'rejected'}`, () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }
});

describe('status helpers', () => {
  it('only DRAFT is editable', () => {
    expect(enumValues(QuoteStatus).filter(isEditable)).toEqual([S.DRAFT]);
  });

  it('final statuses have no way out', () => {
    expect(enumValues(QuoteStatus).filter(isFinal)).toEqual([S.ACCEPTED, S.DECLINED, S.EXPIRED]);
  });

  it('open means waiting for the client', () => {
    expect(enumValues(QuoteStatus).filter(isOpen)).toEqual([S.SENT, S.VIEWED]);
  });
});

describe('effectiveStatus', () => {
  it('shows EXPIRED for an open quote past its date', () => {
    expect(effectiveStatus(S.SENT, '2026-10-01', '2026-10-02')).toBe(S.EXPIRED);
    expect(effectiveStatus(S.VIEWED, '2026-10-01', '2026-10-02')).toBe(S.EXPIRED);
  });

  it('keeps the status on the last valid day', () => {
    expect(effectiveStatus(S.SENT, '2026-10-02', '2026-10-02')).toBe(S.SENT);
  });

  it('never changes drafts or final statuses', () => {
    expect(effectiveStatus(S.DRAFT, '2020-01-01', '2026-10-02')).toBe(S.DRAFT);
    expect(effectiveStatus(S.ACCEPTED, '2020-01-01', '2026-10-02')).toBe(S.ACCEPTED);
  });
});

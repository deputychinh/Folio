import { describe, expect, it } from 'vitest';
import { addDays, formatDate, formatMoney, formatPercent, toIsoDate } from '../src/format';

describe('format', () => {
  it('formats money with the currency decimals', () => {
    expect(formatMoney(123456, 'USD')).toBe('$1,234.56');
    expect(formatMoney(2500000, 'VND')).toBe('₫2,500,000');
  });

  it('formats ISO dates and timestamps in UTC', () => {
    expect(formatDate('2026-10-08')).toBe('Oct 8, 2026');
    expect(formatDate('2026-10-08T23:30:00Z')).toBe('Oct 8, 2026');
  });

  it('formats percentages', () => {
    expect(formatPercent(12.5)).toBe('12.5%');
    expect(formatPercent(66.6666)).toBe('66.67%');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-10-25', 30)).toBe('2026-11-24');
    expect(toIsoDate(new Date('2026-02-28T12:00:00Z'))).toBe('2026-02-28');
  });
});

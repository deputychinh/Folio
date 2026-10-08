import { describe, expect, it } from 'vitest';
import { DiscountType } from '../src/enums';
import { calcLineTotal, calcQuoteTotals, fromMinor, toMinor } from '../src/money';

const noDiscount = { type: DiscountType.AMOUNT, value: 0 };

describe('toMinor / fromMinor', () => {
  it('converts with 2 decimals by default', () => {
    expect(toMinor('12.34', 'USD')).toBe(1234);
    expect(fromMinor(1234, 'USD')).toBe(12.34);
  });

  it('uses 0 decimals for VND', () => {
    expect(toMinor(250000, 'VND')).toBe(250000);
    expect(fromMinor(250000, 'VND')).toBe(250000);
  });

  it('avoids float drift (0.1 + 0.2 style inputs)', () => {
    expect(toMinor('19.99', 'USD')).toBe(1999);
    expect(toMinor(1.005 * 100, 'USD')).toBe(10050);
  });
});

describe('calcLineTotal', () => {
  it('multiplies whole quantities', () => {
    expect(calcLineTotal({ quantity: 3, unitPriceMinor: 12500 })).toBe(37500);
  });

  it('supports 2-decimal quantities and rounds half-up', () => {
    expect(calcLineTotal({ quantity: 1.5, unitPriceMinor: 333 })).toBe(500); // 499.5 → 500
    expect(calcLineTotal({ quantity: 0.25, unitPriceMinor: 1 })).toBe(0); // 0.25 → 0
  });

  it('stays exact for large values', () => {
    expect(calcLineTotal({ quantity: 99999.99, unitPriceMinor: 10_000_000_000 })).toBe(999_999_900_000_000);
  });
});

describe('calcQuoteTotals', () => {
  const lines = [
    { quantity: 10, unitPriceMinor: 9500 }, // 950.00
    { quantity: 1, unitPriceMinor: 120000 }, // 1200.00
  ];

  it('sums lines with no discount and no tax', () => {
    expect(calcQuoteTotals(lines, noDiscount, 0)).toEqual({
      subtotalMinor: 215000,
      discountMinor: 0,
      taxMinor: 0,
      totalMinor: 215000,
    });
  });

  it('applies a percent discount before tax', () => {
    expect(calcQuoteTotals(lines, { type: DiscountType.PERCENT, value: 10 }, 8)).toEqual({
      subtotalMinor: 215000,
      discountMinor: 21500,
      taxMinor: 15480,
      totalMinor: 208980, // taxable 193500 + tax 15480
    });
  });

  it('caps an amount discount at the subtotal', () => {
    const totals = calcQuoteTotals([{ quantity: 1, unitPriceMinor: 5000 }], { type: DiscountType.AMOUNT, value: 9000 }, 10);
    expect(totals).toEqual({ subtotalMinor: 5000, discountMinor: 5000, taxMinor: 0, totalMinor: 0 });
  });

  it('handles fractional percentages', () => {
    const totals = calcQuoteTotals([{ quantity: 1, unitPriceMinor: 10001 }], { type: DiscountType.PERCENT, value: 12.5 }, 7.25);
    // discount 1250.125 → 1250; taxable 8751; tax 634.4475 → 634
    expect(totals).toEqual({ subtotalMinor: 10001, discountMinor: 1250, taxMinor: 634, totalMinor: 9385 });
  });

  it('returns zeros for an empty quote', () => {
    expect(calcQuoteTotals([], noDiscount, 10)).toEqual({ subtotalMinor: 0, discountMinor: 0, taxMinor: 0, totalMinor: 0 });
  });
});

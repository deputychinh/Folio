// Quote maths, written once. The editor uses it for live totals and the API
// recomputes with it before saving, so the browser's numbers are never trusted.
// All amounts are integer minor units (cents). Rounding: half-up, once per step.

import { CURRENCY_DECIMALS, CURRENCY_DECIMALS_DEFAULT } from './constants';
import { DiscountType } from './enums';

export interface LineInput {
  quantity: number;
  unitPriceMinor: number;
}

export interface Discount {
  type: DiscountType;
  /** Percent (e.g. 12.5) when type is PERCENT, minor units when type is AMOUNT. */
  value: number;
}

export interface QuoteTotals {
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}

export function currencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency] ?? CURRENCY_DECIMALS_DEFAULT;
}

/** 12.34 USD → 1234. Accepts strings from form inputs. */
export function toMinor(major: number | string, currency: string): number {
  const factor = 10 ** currencyDecimals(currency);
  return Math.round(Number(major) * factor);
}

/** 1234 USD → 12.34 */
export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** currencyDecimals(currency);
}

/**
 * Round a × b / divisor half-up with BigInt, so large prices never lose precision.
 * Inputs are never negative: validators reject negative prices, quantities and rates.
 */
function mulDivRound(a: number, b: number, divisor: number): number {
  const div = BigInt(divisor);
  return Number((BigInt(a) * BigInt(b) + div / 2n) / div);
}

/** Quantity may have 2 decimals (e.g. 1.5 days). */
export function calcLineTotal({ quantity, unitPriceMinor }: LineInput): number {
  return mulDivRound(Math.round(quantity * 100), unitPriceMinor, 100);
}

export function calcQuoteTotals(lines: LineInput[], discount: Discount, taxPercent: number): QuoteTotals {
  const subtotalMinor = lines.reduce((sum, line) => sum + calcLineTotal(line), 0);

  const discountMinor =
    discount.type === DiscountType.PERCENT
      ? mulDivRound(subtotalMinor, Math.round(discount.value * 100), 10_000)
      : Math.min(Math.round(discount.value), subtotalMinor);

  const taxableMinor = subtotalMinor - discountMinor;
  const taxMinor = mulDivRound(taxableMinor, Math.round(taxPercent * 100), 10_000);

  return { subtotalMinor, discountMinor, taxMinor, totalMinor: taxableMinor + taxMinor };
}

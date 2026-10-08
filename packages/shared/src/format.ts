// Display formatting shared by the app and the public quote page.

import { currencyDecimals, fromMinor } from './money';

const LOCALE = 'en-US';

export function formatMoney(minor: number, currency: string): string {
  const decimals = currencyDecimals(currency);
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fromMinor(minor, currency));
}

/** "2026-10-08" or a full ISO timestamp → "Oct 8, 2026". */
export function formatDate(iso: string): string {
  const date = iso.length === 10 ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat(LOCALE, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(value)}%`;
}

/** ISO date (YYYY-MM-DD) for a Date, in UTC. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

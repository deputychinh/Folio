import { toIsoDate } from '@folio/shared';

/** Today as YYYY-MM-DD in UTC — the same calendar the database uses for current_date. */
export function today(): string {
  return toIsoDate(new Date());
}

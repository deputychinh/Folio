import { ErrorCode } from '@folio/shared';
import { ERROR_STATUS } from '../../src/common/app-error';
import { toRange, toSearchPattern } from '../../src/common/pagination';
import { hashToken } from '../../src/common/token';
import { winRate } from '../../src/modules/dashboard/dashboard.service';
import { toAppError } from '../../src/supabase/db-error';

describe('winRate', () => {
  it('is null when nothing was decided', () => expect(winRate(0, 0)).toBeNull());
  it('rounds to one decimal', () => expect(winRate(2, 3)).toBe(66.7));
});

describe('toAppError', () => {
  it('maps codes raised by our Postgres functions', () => {
    expect(toAppError({ message: 'INVALID_TRANSITION', code: 'P0001' }).code).toBe(ErrorCode.INVALID_TRANSITION);
  });

  it.each([
    ['PGRST116', ErrorCode.NOT_FOUND],
    ['42501', ErrorCode.FORBIDDEN],
    ['23505', ErrorCode.CONFLICT],
    ['22P02', ErrorCode.VALIDATION_ERROR],
    ['XX000', ErrorCode.INTERNAL_ERROR],
  ])('maps Postgres code %s', (code, expected) => {
    expect(toAppError({ code, message: 'boom' }).code).toBe(expected);
  });

  it('has an HTTP status for every error code', () => {
    for (const code of Object.values(ErrorCode)) expect(ERROR_STATUS[code]).toBeGreaterThanOrEqual(400);
  });
});

describe('pagination helpers', () => {
  it('turns page and size into an inclusive range', () => {
    expect(toRange({ page: 3, pageSize: 10 })).toEqual({ from: 20, to: 29, page: 3, pageSize: 10 });
  });

  it('escapes characters that would change a PostgREST filter', () => {
    expect(toSearchPattern(' 50%_off,(x) ')).toBe('%50\\%\\_off\\,\\(x\\)%');
  });
});

it('hashes tokens with sha256', () => {
  expect(hashToken('folio-demo-quote')).toMatch(/^[0-9a-f]{64}$/);
});

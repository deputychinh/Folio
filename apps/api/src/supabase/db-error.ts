import { ErrorCode } from '@folio/shared';
import { AppError, isErrorCode } from '../common/app-error';

interface DbError {
  code?: string;
  message: string;
}

/**
 * Turn a Supabase/PostgREST error into an AppError.
 * Our Postgres functions raise the ErrorCode string as the message.
 */
export function toAppError(error: DbError): AppError {
  if (isErrorCode(error.message)) return new AppError(error.message);
  switch (error.code) {
    case 'PGRST116': // .single() found no row
      return new AppError(ErrorCode.NOT_FOUND);
    case '42501': // RLS or grant denied
      return new AppError(ErrorCode.FORBIDDEN);
    case '23505': // unique violation
      return new AppError(ErrorCode.CONFLICT);
    case '23503': // foreign key violation
    case '23514': // check violation
    case '22P02': // invalid input syntax (e.g. bad uuid)
      return new AppError(ErrorCode.VALIDATION_ERROR);
    default:
      return new AppError(ErrorCode.INTERNAL_ERROR, undefined, { dbCode: error.code });
  }
}

/**
 * Unwrap a Supabase result: throw on error, return data otherwise.
 * Without an error, data is present (functions returning void give null, which callers ignore).
 */
export function unwrap<R extends { data: unknown; error: DbError | null }>(result: R): NonNullable<R['data']> {
  if (result.error) throw toAppError(result.error);
  return result.data as NonNullable<R['data']>;
}

import { ErrorCode } from '@folio/shared';

/** HTTP status for each error code. The only place this mapping exists. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INVALID_TRANSITION]: 409,
  [ErrorCode.QUOTE_EXPIRED]: 410,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Some fields are not valid.',
  [ErrorCode.UNAUTHORIZED]: 'Please sign in again.',
  [ErrorCode.FORBIDDEN]: 'You do not have access to this.',
  [ErrorCode.NOT_FOUND]: 'We could not find that.',
  [ErrorCode.CONFLICT]: 'This change conflicts with the current state.',
  [ErrorCode.INVALID_TRANSITION]: 'This quote can no longer be changed this way.',
  [ErrorCode.QUOTE_EXPIRED]: 'This quote has expired.',
  [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment.',
  [ErrorCode.INTERNAL_ERROR]: 'Something went wrong on our side.',
};

/** The only error type services throw. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = DEFAULT_MESSAGE[code],
    readonly details?: unknown,
  ) {
    super(message);
  }

  get status(): number {
    return ERROR_STATUS[this.code];
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in ERROR_STATUS;
}

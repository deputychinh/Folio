import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ErrorCode, type ApiError } from '@folio/shared';
import type { Response } from 'express';
import { AppError } from './app-error';
import { log } from './logger';
import type { AppRequest } from './request-context';

/** Every failure leaves the API as the same ApiError envelope. */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const req = host.switchToHttp().getRequest<AppRequest>();
    const res = host.switchToHttp().getResponse<Response>();
    const error = toAppError(exception);

    if (error.status >= 500) {
      log('error', 'unhandled', { requestId: req.requestId, error: String(exception), stack: (exception as Error)?.stack });
    }

    const retryAfter = (error.details as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds;
    if (error.code === ErrorCode.RATE_LIMITED && retryAfter) res.setHeader('Retry-After', String(retryAfter));

    const body: ApiError = {
      error: { code: error.code, message: error.message, details: error.details, requestId: req.requestId },
    };
    res.status(error.status).json(body);
  }
}

function toAppError(exception: unknown): AppError {
  if (exception instanceof AppError) return exception;
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 400) {
      const response = exception.getResponse() as { message?: unknown };
      return new AppError(ErrorCode.VALIDATION_ERROR, undefined, response.message);
    }
    if (status === 404) return new AppError(ErrorCode.NOT_FOUND);
    if (status === 413) return new AppError(ErrorCode.VALIDATION_ERROR, 'The request is too large.');
  }
  return new AppError(ErrorCode.INTERNAL_ERROR);
}

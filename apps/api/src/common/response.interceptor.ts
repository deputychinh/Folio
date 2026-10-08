import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiSuccess } from '@folio/shared';
import { map, type Observable } from 'rxjs';
import { Paged } from './pagination';

/** Wraps every successful result in the { data, meta? } envelope. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<ApiSuccess<unknown>> {
    return next.handle().pipe(
      map((result: unknown) =>
        result instanceof Paged ? { data: result.items, meta: result.meta } : { data: result ?? null },
      ),
    );
  }
}

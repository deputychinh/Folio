import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import { log } from './logger';
import type { AppRequest } from './request-context';

const HEADER = 'x-request-id';

export function requestIdMiddleware(req: AppRequest, res: Response, next: NextFunction): void {
  const incoming = req.header(HEADER);
  req.requestId = incoming && incoming.length <= 64 ? incoming : randomUUID();
  res.setHeader(HEADER, req.requestId);

  const started = Date.now();
  res.on('finish', () => {
    log('info', 'request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - started,
    });
  });
  next();
}

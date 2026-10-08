import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './create-app';
import { log } from './common/logger';

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

// Built once per function instance and reused by later invocations,
// so only the first request on a new instance pays the start-up cost.
let handler: Promise<Handler> | undefined;

async function build(): Promise<Handler> {
  const started = Date.now();
  const app = await createApp();
  await app.init();
  log('info', 'cold start', { coldStart: true, ms: Date.now() - started });
  return app.getHttpAdapter().getInstance() as Handler;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  handler ??= build();
  (await handler)(req, res);
}

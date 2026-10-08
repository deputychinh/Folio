import { loadEnv } from './config/env';
import { createApp } from './create-app';
import { log } from './common/logger';

async function main(): Promise<void> {
  const app = await createApp();
  const { port } = loadEnv();
  await app.listen(port);
  log('info', 'api started', { port });
}

void main();

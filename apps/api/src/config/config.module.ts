import { Global, Module } from '@nestjs/common';
import { APP_URL } from './app-url';
import { loadEnv } from './env';

@Global()
@Module({
  providers: [{ provide: APP_URL, useFactory: () => loadEnv().appUrl }],
  exports: [APP_URL],
})
export class ConfigModule {}

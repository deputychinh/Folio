import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { API_PREFIX } from '@folio/shared';
import { AppModule } from './app.module';
import { ErrorFilter } from './common/error.filter';
import { requestIdMiddleware } from './common/request-id.middleware';
import { ResponseInterceptor } from './common/response.interceptor';

const BODY_LIMIT = '200kb';

/** One app factory shared by local dev (main.ts), Vercel (serverless.ts) and tests. */
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'], bodyParser: false });
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  express.set('trust proxy', true);

  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.use(requestIdMiddleware);
  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new ErrorFilter());
  return app;
}

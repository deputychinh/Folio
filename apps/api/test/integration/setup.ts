import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { WORKSPACE_HEADER } from '@folio/shared';
import { createApp } from '../../src/create-app';

// Jest gives each test file its own copy of process.env, so copy the values in by hand.
Object.assign(process.env, parseEnv(readFileSync(`${__dirname}/../../../../.env`, 'utf8')));

const url = process.env.SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PASSWORD = 'Test@12345';

export const API = '/api/v1';

export async function startApp(): Promise<NestExpressApplication> {
  const app = await createApp();
  await app.init();
  return app;
}

/** A brand-new confirmed user with a fresh access token. */
export async function newUser(name = 'Test User'): Promise<{ id: string; email: string; token: string }> {
  const email = `it-${randomUUID()}@folio.test`;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const created = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
  if (created.error) throw created.error;

  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const session = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (session.error) throw session.error;
  return { id: created.data.user.id, email, token: session.data.session.access_token };
}

/** supertest helpers that add the auth and workspace headers. */
export function as(app: NestExpressApplication, token: string, workspaceId?: string) {
  const withHeaders = (req: request.Test) => {
    req.set('Authorization', `Bearer ${token}`);
    if (workspaceId) req.set(WORKSPACE_HEADER, workspaceId);
    return req;
  };
  const server = app.getHttpServer();
  return {
    get: (path: string) => withHeaders(request(server).get(API + path)),
    post: (path: string, body?: object) => withHeaders(request(server).post(API + path)).send(body ?? {}),
    put: (path: string, body: object) => withHeaders(request(server).put(API + path)).send(body),
    patch: (path: string, body: object) => withHeaders(request(server).patch(API + path)).send(body),
    delete: (path: string) => withHeaders(request(server).delete(API + path)),
  };
}

export function anonymous(app: NestExpressApplication, ip = `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`) {
  const server = app.getHttpServer();
  return {
    get: (path: string) => request(server).get(API + path).set('x-forwarded-for', ip),
    post: (path: string, body: object) => request(server).post(API + path).set('x-forwarded-for', ip).send(body),
  };
}

import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadEnv } from '../config/env';
import type { Database } from './database.types';

export type Db = SupabaseClient<Database>;

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** The only place Supabase clients are created. */
@Injectable()
export class SupabaseService {
  private readonly env = loadEnv();
  private readonly anonClient: Db = createClient<Database>(this.env.supabaseUrl, this.env.supabaseAnonKey, NO_SESSION);
  private adminClient?: Db;

  /** Verifies an access token (JWKS, cached) and returns its claims, or null. */
  async verifyToken(token: string): Promise<{ sub: string; email: string } | null> {
    const { data, error } = await this.anonClient.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return { sub: data.claims.sub, email: String(data.claims.email ?? '') };
  }

  /** A client that acts as the user: every query goes through RLS. */
  forUser(token: string): Db {
    return createClient<Database>(this.env.supabaseUrl, this.env.supabaseAnonKey, {
      ...NO_SESSION,
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }

  /** Service role. Only the public-quote module may call this. */
  admin(): Db {
    this.adminClient ??= createClient<Database>(this.env.supabaseUrl, this.env.supabaseServiceRoleKey, NO_SESSION);
    return this.adminClient;
  }
}

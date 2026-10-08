// Environment, read and checked once at start-up. Nothing else reads process.env.

export interface Env {
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** Used only by the public-quote module, through two locked-down Postgres functions. */
  supabaseServiceRoleKey: string;
  /** Base URL of the SPA, used to build share and invite links. */
  appUrl: string;
  port: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

let cached: Env | undefined;

export function loadEnv(): Env {
  cached ??= {
    supabaseUrl: required('SUPABASE_URL'),
    supabaseAnonKey: required('SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
    appUrl: required('APP_URL').replace(/\/$/, ''),
    port: Number(process.env.PORT ?? 3001),
  };
  return cached;
}

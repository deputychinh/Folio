// Supabase is used in the browser for authentication only.
// All data goes through the API (/api/v1), where the business rules live.

// Only the Auth part of Supabase is bundled (@supabase/auth-js), which keeps the
// first load small: no realtime, storage or database client in the browser.
import { AuthClient } from '@supabase/auth-js';
import { ROUTES } from '@folio/shared';

const client = new AuthClient({
  url: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`,
  headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
  storageKey: 'folio.auth',
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
});
const supabase = { auth: client };

function check({ data, error }) {
  if (error) throw error;
  return data;
}

const redirect = (path) => `${window.location.origin}${path}`;

export const auth = {
  /** Access token for the API, refreshed by supabase-js when needed. */
  async getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },

  async hasSession() {
    return (await this.getToken()) !== null;
  },

  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }).then(check),

  signUp: (email, password, fullName) =>
    supabase.auth
      .signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: redirect(ROUTES.DASHBOARD) } })
      .then(check),

  sendMagicLink: (email) =>
    supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect(ROUTES.DASHBOARD), shouldCreateUser: false } }).then(check),

  sendPasswordReset: (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect(`${ROUTES.RESET}?mode=update`) }).then(check),

  updatePassword: (password) => supabase.auth.updateUser({ password }).then(check),

  signOut: () => supabase.auth.signOut(),

  /** @param {(event: string) => void} listener */
  onChange(listener) {
    const { data } = supabase.auth.onAuthStateChange((event) => listener(event));
    return () => data.subscription.unsubscribe();
  },
};

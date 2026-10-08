// Route guards: each returns a path to redirect to, or null to continue.
import { ROUTES } from '@folio/shared';
import { auth } from './auth.js';
import { currentWorkspace, loadSession, session } from '../state/session.js';

const withNext = (path, ctx) => `${path}?next=${encodeURIComponent(ctx.path + window.location.search)}`;

export async function requireAuth(ctx) {
  if (!(await auth.hasSession())) return withNext(ROUTES.LOGIN, ctx);
  if (!session.get().me) await loadSession();
  return null;
}

export async function requireWorkspace(ctx) {
  const redirect = await requireAuth(ctx);
  if (redirect) return redirect;
  return currentWorkspace() ? null : ROUTES.ONBOARDING;
}

export async function guestOnly() {
  return (await auth.hasSession()) ? ROUTES.DASHBOARD : null;
}

/** Where to go after signing in: the ?next= path if it is a safe local path. */
export function nextPath(query) {
  const next = query.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.DASHBOARD;
}

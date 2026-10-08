// The current workspace's details (currency, tax, branding), fetched once per workspace.
import { api } from '../core/api.js';
import { session } from './session.js';

let cache = { id: null, promise: null };

/** @returns {Promise<import('@folio/shared').Workspace>} */
export function loadWorkspace() {
  const { workspaceId } = session.get();
  if (cache.id !== workspaceId || !cache.promise) {
    cache = { id: workspaceId, promise: api.get('/workspaces/current').then((r) => r.data) };
    cache.promise.catch(() => (cache = { id: null, promise: null }));
  }
  return cache.promise;
}

export async function currentWorkspaceCurrency() {
  return (await loadWorkspace()).currency;
}

/** Call after the workspace settings change. */
export function forgetWorkspace() {
  cache = { id: null, promise: null };
}

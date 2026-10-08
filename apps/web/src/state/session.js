// Who is signed in and which workspace they are working in.

import { api, apiConfig } from '../core/api.js';
import { createStore } from '../core/store.js';

const WORKSPACE_KEY = 'folio.workspace';

function readSavedWorkspace() {
  try {
    return localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
}

function saveWorkspace(id) {
  try {
    localStorage.setItem(WORKSPACE_KEY, id);
  } catch {
    // Private mode or blocked storage: the choice simply is not remembered.
  }
}

/** @type {ReturnType<typeof createStore<{ me: import('@folio/shared').Me | null, workspaceId: string | null }>>} */
export const session = createStore({ me: null, workspaceId: null });

export function currentWorkspace() {
  const { me, workspaceId } = session.get();
  return me?.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
}

export function selectWorkspace(id) {
  apiConfig.setWorkspace(id);
  saveWorkspace(id);
  session.set({ workspaceId: id });
}

/** Load /me and pick the saved workspace, or the first one. */
export async function loadSession() {
  const { data: me } = await api.get('/me');
  const saved = readSavedWorkspace();
  const workspace = me.workspaces.find((w) => w.id === saved) ?? me.workspaces[0] ?? null;
  session.set({ me });
  if (workspace) selectWorkspace(workspace.id);
  return me;
}

export function clearSession() {
  apiConfig.setWorkspace(null);
  session.set({ me: null, workspaceId: null });
}

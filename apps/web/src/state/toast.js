import { TOAST_DURATION_MS } from '@folio/shared';
import { createStore } from '../core/store.js';

/** @typedef {{ id: number, message: string, tone: 'success' | 'error' | 'info' }} Toast */

/** @type {ReturnType<typeof createStore<{ items: Toast[] }>>} */
export const toasts = createStore({ items: [] });
let nextId = 1;

export function dismissToast(id) {
  toasts.set({ items: toasts.get().items.filter((toast) => toast.id !== id) });
}

/** @param {string} message @param {Toast['tone']} [tone] */
export function showToast(message, tone = 'success') {
  const id = nextId++;
  toasts.set({ items: [...toasts.get().items, { id, message, tone }] });
  setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
}

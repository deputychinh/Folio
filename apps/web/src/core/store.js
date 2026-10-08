// A tiny observable store: get, set, subscribe. Enough for session and toasts.

/**
 * @template T
 * @param {T} initial
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    /** @returns {T} */
    get: () => state,
    /** @param {Partial<T>} patch */
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    /** @param {(state: T) => void} listener @returns {() => void} unsubscribe */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// The load → skeleton → content / error → retry cycle every data view needs.
import { on, render } from '../../core/dom.js';
import { ErrorState } from '../empty-state/empty-state.js';
import { Skeleton } from '../skeleton/skeleton.js';

/**
 * @template T
 * @param {HTMLElement} container
 * @param {() => Promise<T>} load
 * @param {(data: T) => ReturnType<import('../../core/dom.js').html>} draw
 * @returns {{ reload: () => Promise<void>, destroy: () => void }}
 */
export function asyncView(container, load, draw, { rows = 5 } = {}) {
  let alive = true;

  async function reload() {
    render(container, Skeleton({ rows }));
    try {
      const data = await load();
      if (alive) render(container, draw(data));
    } catch (error) {
      if (alive) render(container, ErrorState(error));
    }
  }

  const offRetry = on(container, 'click', '[data-action="retry"]', () => void reload());
  void reload();
  return {
    reload,
    destroy() {
      alive = false;
      offRetry();
    },
  };
}

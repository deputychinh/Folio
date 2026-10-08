// Reading list filters from the URL, so every list view can be shared and reloaded.
import { SEARCH_DEBOUNCE_MS } from '@folio/shared';
import { on } from '../core/dom.js';
import { setQuery } from '../core/router.js';
import { debounce } from './debounce.js';

/** URLSearchParams → plain object of the keys we care about (empty values dropped). */
export function readQuery(query, keys) {
  const result = {};
  for (const key of keys) {
    const value = query.get(key);
    if (value) result[key] = key === 'page' ? Number(value) : value;
  }
  return result;
}

/**
 * Wire the search box ([data-search]) and pagination buttons ([data-page]) of a list page.
 * Searching resets to page 1.
 * @returns {() => void} cleanup
 */
export function bindListControls(root) {
  const search = debounce((value) => setQuery({ search: value, page: undefined }), SEARCH_DEBOUNCE_MS);
  const offs = [
    on(root, 'input', '[data-search]', (_, input) => search(input.value.trim())),
    on(root, 'click', '[data-page]', (_, button) => setQuery({ page: Number(button.dataset.page) > 1 ? button.dataset.page : undefined })),
  ];
  return () => {
    search.cancel();
    offs.forEach((off) => off());
  };
}

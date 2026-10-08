import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

/** Previous / next buttons with data-page; the page calls setQuery({ page }). */
export function Pagination(meta) {
  const pages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  if (pages <= 1) return html``;
  return html`
    <nav class="pagination" aria-label="Pagination">
      <span class="pagination__status">${copy.common.pageOf(meta.page, pages)} · ${copy.common.results(meta.total)}</span>
      <div class="pagination__buttons">
        <button class="button button--small" type="button" data-page="${meta.page - 1}" ${meta.page <= 1 ? html`disabled` : ''}>
          ${copy.common.previous}
        </button>
        <button class="button button--small" type="button" data-page="${meta.page + 1}" ${meta.page >= pages ? html`disabled` : ''}>
          ${copy.common.next}
        </button>
      </div>
    </nav>
  `;
}

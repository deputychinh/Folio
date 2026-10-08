import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

/** Grey placeholder lines while data loads. */
export function Skeleton({ rows = 5 } = {}) {
  return html`
    <div class="skeleton" aria-busy="true">
      <span class="visually-hidden">${copy.common.loading}</span>
      ${Array.from({ length: rows }, (_, i) => html`<div class="skeleton__line${i % 3 === 2 ? ' skeleton__line--short' : ''}"></div>`)}
    </div>
  `;
}

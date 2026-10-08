import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

/** @param {{ title: string, text?: string, action?: ReturnType<typeof html> | string }} props */
export function EmptyState({ title, text, action }) {
  return html`
    <div class="empty-state">
      <div class="empty-state__mark" aria-hidden="true"></div>
      <h2 class="empty-state__title">${title}</h2>
      ${text ? html`<p class="empty-state__text">${text}</p>` : ''}
      ${action ? html`<div class="empty-state__action">${action}</div>` : ''}
    </div>
  `;
}

/** A failed load, with a retry button (data-action="retry") the page listens for. */
export function ErrorState(error) {
  return html`
    <div class="empty-state empty-state--error" role="alert">
      <h2 class="empty-state__title">${error?.message || copy.errors.generic}</h2>
      ${error?.requestId ? html`<p class="empty-state__text">${copy.errors.reference}: ${error.requestId}</p>` : ''}
      <div class="empty-state__action">
        <button class="button" type="button" data-action="retry">${copy.errors.retry}</button>
      </div>
    </div>
  `;
}

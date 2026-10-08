import { html } from '../../core/dom.js';

/**
 * @param {{ eyebrow?: unknown, title: unknown, lead?: unknown, actions?: unknown }} props
 * The editorial page heading: eyebrow, serif title, lead, actions. Styled by .page__* in layout.css. */
export function PageHeader({ eyebrow, title, lead, actions }) {
  return html`
    <header class="page__header">
      <div>
        ${eyebrow ? html`<p class="page__eyebrow">${eyebrow}</p>` : ''}
        <h1 class="page__title">${title}</h1>
        ${lead ? html`<p class="page__lead">${lead}</p>` : ''}
      </div>
      ${actions ? html`<div class="page__actions">${actions}</div>` : ''}
    </header>
  `;
}

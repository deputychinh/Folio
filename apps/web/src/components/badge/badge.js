import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

/** The status → modifier mapping lives here and nowhere else: badge--{status}. */
export function StatusBadge(status) {
  return html`<span class="badge badge--${status}">${copy.status[status] ?? status}</span>`;
}

export function Badge(label, modifier = 'neutral') {
  return html`<span class="badge badge--${modifier}">${label}</span>`;
}

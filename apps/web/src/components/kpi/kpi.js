import { html } from '../../core/dom.js';

/** A headline number with a label and an optional note.
 * @param {{ label: string, value: string, note?: string, accent?: boolean }} props */
export function Kpi({ label, value, note, accent = false }) {
  return html`
    <article class="kpi${accent ? ' kpi--accent' : ''}">
      <h2 class="kpi__label">${label}</h2>
      <p class="kpi__value">${value}</p>
      ${note ? html`<p class="kpi__note">${note}</p>` : ''}
    </article>
  `;
}

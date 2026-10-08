import { html } from '../../core/dom.js';
import { icons } from '../icon/icon.js';

/** A search box. The page listens for `input` on [data-search]. */
export function SearchInput({ label, placeholder, value }) {
  return html`
    <label class="search">
      <span class="visually-hidden">${label}</span>
      <span class="search__icon">${icons.search}</span>
      <input class="search__input" type="search" data-search value="${value ?? ''}" placeholder="${placeholder}" autocomplete="off" />
    </label>
  `;
}

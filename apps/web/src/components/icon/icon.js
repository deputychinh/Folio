// Small stroke icons (24×24, currentColor). Static markup, so html`` keeps it as is.
import { html } from '../../core/dom.js';

const svg = (paths) => html`<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

export const icons = {
  overview: svg(html`<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>`),
  quotes: svg(html`<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>`),
  customers: svg(html`<path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M21 19v-1a4 4 0 0 0-3-3.9M15.5 4.1a3.5 3.5 0 0 1 0 6.8"/>`),
  catalog: svg(html`<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/>`),
  settings: svg(html`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
  plus: svg(html`<path d="M12 5v14M5 12h14"/>`),
  search: svg(html`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`),
  close: svg(html`<path d="M6 6l12 12M18 6 6 18"/>`),
  trash: svg(html`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`),
  link: svg(html`<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`),
  copy: svg(html`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`),
  printer: svg(html`<path d="M6 9V3h12v6M6 18H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-2"/><path d="M6 14h12v7H6z"/>`),
  check: svg(html`<path d="m5 12 5 5 9-10"/>`),
  menu: svg(html`<path d="M4 6h16M4 12h16M4 18h16"/>`),
  arrowLeft: svg(html`<path d="M19 12H5M11 18l-6-6 6-6"/>`),
  logout: svg(html`<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>`),
};

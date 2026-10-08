// The signed-in layout: sidebar navigation, workspace switcher, user menu.
import { ROUTES } from '@folio/shared';
import { auth } from '../../core/auth.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { navigate, reload } from '../../core/router.js';
import { clearSession, currentWorkspace, selectWorkspace, session } from '../../state/session.js';
import { icons } from '../icon/icon.js';

const NAV = [
  { href: ROUTES.DASHBOARD, label: copy.nav.dashboard, icon: icons.overview, exact: true },
  { href: ROUTES.QUOTES, label: copy.nav.quotes, icon: icons.quotes },
  { href: ROUTES.CUSTOMERS, label: copy.nav.customers, icon: icons.customers },
  { href: ROUTES.CATALOG, label: copy.nav.catalog, icon: icons.catalog },
  { href: ROUTES.SETTINGS, label: copy.nav.settings, icon: icons.settings },
];

export function BrandMark() {
  return html`<span class="brand-mark">${copy.brand.name}<span class="brand-mark__dot" aria-hidden="true">.</span></span>`;
}

function Sidebar({ me, workspaceId }) {
  const workspace = currentWorkspace();
  return html`
    <div class="app-shell__brand">
      <a class="app-shell__home" href="${ROUTES.DASHBOARD}">${BrandMark()}</a>
    </div>

    <div class="app-shell__workspace">
      <label class="app-shell__label" for="workspace-switcher">${copy.nav.workspace}</label>
      ${me && me.workspaces.length > 1
        ? html`<select class="app-shell__switcher" id="workspace-switcher" data-workspace-switcher>
            ${me.workspaces.map((w) => html`<option value="${w.id}" ${w.id === workspaceId ? html`selected` : ''}>${w.name}</option>`)}
          </select>`
        : html`<p class="app-shell__workspace-name" id="workspace-switcher">${workspace?.name ?? ''}</p>`}
    </div>

    <a class="button button--accent button--block app-shell__cta" href="${ROUTES.QUOTE_NEW}">${icons.plus} ${copy.nav.newQuote}</a>

    <nav class="app-shell__nav" aria-label="Main">
      <ul class="app-shell__list" role="list">
        ${NAV.map(
          (item) => html`<li>
            <a class="app-shell__link" href="${item.href}" data-exact="${item.exact ? 'true' : 'false'}">
              ${item.icon}<span>${item.label}</span>
            </a>
          </li>`,
        )}
      </ul>
    </nav>

    <div class="app-shell__user">
      <span class="app-shell__avatar" aria-hidden="true">${(me?.fullName || me?.email || '?').charAt(0).toUpperCase()}</span>
      <span class="app-shell__who">
        <span class="app-shell__name">${me?.fullName || me?.email}</span>
        <span class="app-shell__role">${workspace ? copy.role[workspace.role] : ''}</span>
      </span>
      <button class="button button--ghost button--icon" type="button" data-sign-out aria-label="${copy.auth.signOut}" title="${copy.auth.signOut}">
        ${icons.logout}
      </button>
    </div>
  `;
}

function markActive(sidebar, path) {
  sidebar.querySelectorAll('.app-shell__link').forEach((link) => {
    const href = link.getAttribute('href');
    const active = link.dataset.exact === 'true' ? path === href : path === href || path.startsWith(`${href}/`);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** @type {import('../../core/router.js').Layout & { cleanup?: (() => void)[] }} */
export const AppShell = {
  mount(root) {
    const shell = createElement('div', 'app-shell');
    render(
      shell,
      html`
        <a class="skip-link" href="#main-content">${copy.common.skipToContent}</a>
        <header class="app-shell__topbar">
          <button class="button button--ghost button--icon" type="button" data-menu aria-expanded="false" aria-controls="sidebar" aria-label="${copy.nav.menu}">
            ${icons.menu}
          </button>
          <a class="app-shell__home" href="${ROUTES.DASHBOARD}">${BrandMark()}</a>
        </header>
        <aside class="app-shell__sidebar" id="sidebar"></aside>
        <main class="app-shell__main" id="main-content"></main>
      `,
    );
    root.append(shell);

    const sidebar = shell.querySelector('.app-shell__sidebar');
    const menuButton = shell.querySelector('[data-menu]');
    const setMenu = (open) => {
      shell.classList.toggle('app-shell--menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
    };

    const draw = () => {
      render(sidebar, Sidebar(session.get()));
      markActive(sidebar, window.location.pathname);
    };
    draw();

    this.cleanup = [
      session.subscribe(draw),
      on(shell, 'click', '[data-menu]', () => setMenu(!shell.classList.contains('app-shell--menu-open'))),
      on(sidebar, 'click', 'a', () => setMenu(false)),
      on(sidebar, 'change', '[data-workspace-switcher]', (_, select) => {
        selectWorkspace(select.value);
        reload();
      }),
      on(sidebar, 'click', '[data-sign-out]', async () => {
        await auth.signOut();
        clearSession();
        navigate(ROUTES.LOGIN);
      }),
    ];
    return shell.querySelector('.app-shell__main');
  },

  update(ctx) {
    const sidebar = document.querySelector('.app-shell__sidebar');
    if (sidebar) markActive(sidebar, ctx.path);
  },

  unmount() {
    this.cleanup?.forEach((off) => off());
  },
};

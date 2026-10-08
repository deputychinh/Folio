import { ROUTES } from '@folio/shared';
import { copy } from '../../core/copy.js';
import { createElement, html, render } from '../../core/dom.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { mountTeamTab } from './team-tab.js';
import { mountWorkspaceTab } from './workspace-tab.js';

const TABS = { WORKSPACE: 'workspace', TEAM: 'team' };

export async function SettingsPage({ query }) {
  const s = copy.settings;
  const tab = query.get('tab') === TABS.TEAM ? TABS.TEAM : TABS.WORKSPACE;
  const el = createElement('div', 'page settings');
  render(
    el,
    html`
      ${PageHeader({ eyebrow: s.eyebrow, title: s.title })}
      <nav class="tabs settings__tabs" aria-label="${s.title}">
        <a class="tabs__tab" href="${ROUTES.SETTINGS}" ${tab === TABS.WORKSPACE ? html`aria-current="page"` : ''}>${s.tabs.workspace}</a>
        <a class="tabs__tab" href="${ROUTES.SETTINGS}?tab=${TABS.TEAM}" ${tab === TABS.TEAM ? html`aria-current="page"` : ''}>${s.tabs.team}</a>
      </nav>
      <div class="settings__body" data-body></div>
    `,
  );
  const body = el.querySelector('[data-body]');
  const destroy = tab === TABS.TEAM ? mountTeamTab(body) : await mountWorkspaceTab(body);
  return { el, title: s.title, destroy };
}

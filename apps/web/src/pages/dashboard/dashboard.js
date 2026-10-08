import { formatDate, formatMoney, formatPercent, ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, render } from '../../core/dom.js';
import { buildPath } from '../../core/router.js';
import { ActivityList } from '../../components/activity/activity.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { StatusBadge } from '../../components/badge/badge.js';
import { Kpi } from '../../components/kpi/kpi.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { session } from '../../state/session.js';

/** @param {import('@folio/shared').DashboardSummary} summary */
function Dashboard(summary) {
  const money = (minor) => formatMoney(minor, summary.currency);
  return html`
    <div class="stack stack--lg">
      <div class="grid">
        ${Kpi({ label: copy.dashboard.openValue, value: money(summary.openValueMinor), note: copy.dashboard.openCount(summary.openCount), accent: true })}
        ${Kpi({ label: copy.dashboard.wonValue, value: money(summary.wonValueMinor) })}
        ${Kpi({
          label: copy.dashboard.winRate,
          value: summary.winRatePercent === null ? '—' : formatPercent(summary.winRatePercent),
          note: summary.winRatePercent === null ? copy.dashboard.winRateEmpty : '',
        })}
      </div>

      <div class="grid grid--sidebar">
        <section class="card" aria-labelledby="expiring-title">
          <header class="card__header">
            <h2 class="card__title" id="expiring-title">${copy.dashboard.expiring}</h2>
            <a href="${ROUTES.QUOTES}?sort=valid_until_asc">${copy.common.viewAll}</a>
          </header>
          ${summary.expiringSoon.length
            ? html`<div class="table-scroll"><table class="table">
                <tbody>
                  ${summary.expiringSoon.map(
                    (quote) => html`<tr class="table__row">
                      <td class="table__cell">
                        <a class="table__link" href="${buildPath(ROUTES.QUOTE, { id: quote.id })}">${quote.title}</a>
                        <span class="table__sub">${quote.number} · ${quote.customerName}</span>
                      </td>
                      <td class="table__cell">${StatusBadge(quote.status)}</td>
                      <td class="table__cell table__cell--optional">${formatDate(quote.validUntil)}</td>
                      <td class="table__cell table__cell--number table__cell--strong">${money(quote.totalMinor)}</td>
                    </tr>`,
                  )}
                </tbody>
              </table></div>`
            : html`<p class="card__body dashboard__muted">${copy.dashboard.expiringEmpty}</p>`}
        </section>

        <section class="card" aria-labelledby="activity-title">
          <header class="card__header"><h2 class="card__title" id="activity-title">${copy.dashboard.activity}</h2></header>
          <div class="card__body">
            ${summary.recentActivity.length
              ? ActivityList(summary.recentActivity)
              : html`<p class="dashboard__muted">${copy.dashboard.activityEmpty}</p>`}
          </div>
        </section>
      </div>
    </div>
  `;
}

export async function DashboardPage() {
  const el = createElement('div', 'page dashboard');
  render(el, html`${PageHeader({ eyebrow: copy.dashboard.eyebrow, title: copy.dashboard.title(session.get().me?.fullName) })}<div data-body></div>`);
  const view = asyncView(el.querySelector('[data-body]'), () => api.get('/dashboard').then((r) => r.data), Dashboard, { rows: 8 });
  return { el, title: copy.nav.dashboard, destroy: view.destroy };
}

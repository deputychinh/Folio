import { enumValues, formatDate, formatMoney, QuoteSort, QuoteStatus, ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { buildPath, navigate, setQuery } from '../../core/router.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { StatusBadge } from '../../components/badge/badge.js';
import { EmptyState } from '../../components/empty-state/empty-state.js';
import { icons } from '../../components/icon/icon.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { Pagination } from '../../components/pagination/pagination.js';
import { SearchInput } from '../../components/search/search.js';
import { bindListControls, readQuery } from '../../utils/list-query.js';

const QUERY_KEYS = ['status', 'search', 'sort', 'page'];

function Toolbar(filters) {
  const tabs = [{ value: '', label: copy.quotes.allStatuses }, ...enumValues(QuoteStatus).map((value) => ({ value, label: copy.status[value] }))];
  return html`
    <div class="toolbar">
      <nav class="tabs tabs--plain" aria-label="${copy.quotes.columns.status}">
        ${tabs.map(
          (tab) => html`<a class="tabs__tab" href="${ROUTES.QUOTES}${tab.value ? `?status=${tab.value}` : ''}"
            ${(filters.status ?? '') === tab.value ? html`aria-current="page"` : ''}>${tab.label}</a>`,
        )}
      </nav>
      <div class="toolbar__group">
        ${SearchInput({ label: copy.common.search, placeholder: copy.quotes.searchPlaceholder, value: filters.search })}
        <label class="visually-hidden" for="quote-sort">${copy.quotes.sortLabel}</label>
        <select class="toolbar__select" id="quote-sort" data-sort>
          ${enumValues(QuoteSort).map(
            (value) => html`<option value="${value}" ${(filters.sort ?? QuoteSort.NEWEST) === value ? html`selected` : ''}>${copy.sort[value]}</option>`,
          )}
        </select>
      </div>
    </div>
  `;
}

function QuoteTable({ data, meta }, filters) {
  if (!data.length) {
    const filtered = Boolean(filters.status || filters.search);
    return EmptyState({
      title: filtered ? copy.quotes.emptyFiltered : copy.quotes.empty,
      text: filtered ? '' : copy.quotes.emptyText,
      action: filtered ? '' : html`<a class="button button--primary" href="${ROUTES.QUOTE_NEW}">${icons.plus} ${copy.nav.newQuote}</a>`,
    });
  }
  const c = copy.quotes.columns;
  return html`
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th class="table__head" scope="col">${c.number}</th>
            <th class="table__head" scope="col">${c.title}</th>
            <th class="table__head" scope="col">${c.status}</th>
            <th class="table__head table__head--optional" scope="col">${c.validUntil}</th>
            <th class="table__head table__head--number" scope="col">${c.total}</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(
            (quote) => html`<tr class="table__row table__row--link" data-href="${buildPath(ROUTES.QUOTE, { id: quote.id })}">
              <td class="table__cell table__cell--mono">${quote.number}</td>
              <td class="table__cell">
                <a class="table__link" href="${buildPath(ROUTES.QUOTE, { id: quote.id })}">${quote.title}</a>
                <span class="table__sub">${quote.customerName}</span>
              </td>
              <td class="table__cell">${StatusBadge(quote.status)}</td>
              <td class="table__cell table__cell--optional">${formatDate(quote.validUntil)}</td>
              <td class="table__cell table__cell--number table__cell--strong">${formatMoney(quote.totalMinor, quote.currency)}</td>
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
    ${Pagination(meta)}
  `;
}

export async function QuotesPage({ query }) {
  const filters = readQuery(query, QUERY_KEYS);
  const el = createElement('div', 'page');
  render(
    el,
    html`
      ${PageHeader({
        eyebrow: copy.quotes.eyebrow,
        title: copy.quotes.title,
        actions: html`<a class="button button--primary" href="${ROUTES.QUOTE_NEW}">${icons.plus} ${copy.nav.newQuote}</a>`,
      })}
      <section class="card">
        ${Toolbar(filters)}
        <div data-body></div>
      </section>
    `,
  );

  const view = asyncView(el.querySelector('[data-body]'), () => api.get('/quotes', filters), (result) => QuoteTable(result, filters), { rows: 8 });
  const offs = [
    bindListControls(el),
    on(el, 'change', '[data-sort]', (_, select) => setQuery({ sort: select.value === QuoteSort.NEWEST ? undefined : select.value, page: undefined })),
    // The whole row is clickable; the title link stays the accessible target.
    on(el, 'click', '[data-href]', (event, row) => {
      if (!(event.target instanceof Element && event.target.closest('a'))) navigate(row.dataset.href);
    }),
  ];

  return { el, title: copy.quotes.title, destroy: () => [view.destroy, ...offs].forEach((off) => off()) };
}

import { ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { buildPath, navigate, setQuery } from '../../core/router.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { Badge } from '../../components/badge/badge.js';
import { EmptyState } from '../../components/empty-state/empty-state.js';
import { icons } from '../../components/icon/icon.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { Pagination } from '../../components/pagination/pagination.js';
import { SearchInput } from '../../components/search/search.js';
import { bindListControls, readQuery } from '../../utils/list-query.js';
import { openCustomerForm } from './customer-form.js';

const QUERY_KEYS = ['search', 'page', 'includeArchived'];

function CustomerTable({ data, meta }, filters) {
  const c = copy.customers;
  if (!data.length) {
    return filters.search
      ? EmptyState({ title: c.emptyFiltered })
      : EmptyState({ title: c.empty, text: c.emptyText, action: html`<button class="button button--primary" type="button" data-action="add">${icons.plus} ${c.add}</button>` });
  }
  return html`
    <div class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th class="table__head" scope="col">${c.companyName}</th>
            <th class="table__head" scope="col">${c.contactName}</th>
            <th class="table__head table__head--optional" scope="col">${c.email}</th>
            <th class="table__head table__head--optional" scope="col">${c.phone}</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((customer) => {
            const href = buildPath(ROUTES.CUSTOMER, { id: customer.id });
            return html`<tr class="table__row table__row--link" data-href="${href}">
              <td class="table__cell">
                <a class="table__link" href="${href}">${customer.companyName}</a>
                ${customer.archived ? html` ${Badge(c.archived)}` : ''}
              </td>
              <td class="table__cell">${customer.contactName}</td>
              <td class="table__cell table__cell--optional">${customer.email}</td>
              <td class="table__cell table__cell--optional">${customer.phone}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
    ${Pagination(meta)}
  `;
}

export async function CustomersPage({ query }) {
  const c = copy.customers;
  const filters = readQuery(query, QUERY_KEYS);
  const el = createElement('div', 'page');
  render(
    el,
    html`
      ${PageHeader({ eyebrow: c.eyebrow, title: c.title, actions: html`<button class="button button--primary" type="button" data-action="add">${icons.plus} ${c.add}</button>` })}
      <section class="card">
        <div class="toolbar">
          ${SearchInput({ label: copy.common.search, placeholder: c.searchPlaceholder, value: filters.search })}
          <label class="checkbox">
            <input class="checkbox__input" type="checkbox" data-archived ${filters.includeArchived ? html`checked` : ''} />
            ${c.showArchived}
          </label>
        </div>
        <div data-body></div>
      </section>
    `,
  );

  const view = asyncView(el.querySelector('[data-body]'), () => api.get('/customers', filters), (result) => CustomerTable(result, filters), { rows: 8 });
  const offs = [
    bindListControls(el),
    on(el, 'change', '[data-archived]', (_, box) => setQuery({ includeArchived: box.checked ? 'true' : undefined, page: undefined })),
    on(el, 'click', '[data-action="add"]', () => openCustomerForm(null, (customer) => navigate(buildPath(ROUTES.CUSTOMER, { id: customer.id })))),
    on(el, 'click', '[data-href]', (event, row) => {
      if (!(event.target instanceof Element && event.target.closest('a'))) navigate(row.dataset.href);
    }),
  ];
  return { el, title: c.title, destroy: () => [view.destroy, ...offs].forEach((off) => off()) };
}

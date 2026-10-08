import { formatDate, formatMoney, ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on } from '../../core/dom.js';
import { buildPath } from '../../core/router.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { withLoading } from '../../components/button/button.js';
import { Badge, StatusBadge } from '../../components/badge/badge.js';
import { icons } from '../../components/icon/icon.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { showToast } from '../../state/toast.js';
import { openCustomerForm } from '../customers/customer-form.js';

function Detail(customer) {
  const c = copy.customers;
  const contact = [
    [c.contactName, customer.contactName],
    [c.email, customer.email ? html`<a href="mailto:${customer.email}">${customer.email}</a>` : ''],
    [c.phone, customer.phone],
    [c.address, customer.address],
  ].filter(([, value]) => value);

  return html`
    ${PageHeader({
      eyebrow: html`<a href="${ROUTES.CUSTOMERS}">${c.title}</a>`,
      title: customer.companyName,
      actions: html`
        <button class="button" type="button" data-action="edit">${copy.common.edit}</button>
        <button class="button" type="button" data-action="${customer.archived ? 'restore' : 'archive'}">${customer.archived ? c.restore : c.archive}</button>
        ${customer.archived ? '' : html`<a class="button button--primary" href="${ROUTES.QUOTE_NEW}?customer=${customer.id}">${icons.plus} ${c.newQuoteFor}</a>`}
      `,
    })}
    <div class="grid grid--sidebar">
      <section class="card" aria-labelledby="customer-quotes">
        <header class="card__header"><h2 class="card__title" id="customer-quotes">${c.quotes}</h2></header>
        ${customer.quotes.length
          ? html`<div class="table-scroll"><table class="table"><tbody>
              ${customer.quotes.map(
                (quote) => html`<tr class="table__row">
                  <td class="table__cell table__cell--mono">${quote.number}</td>
                  <td class="table__cell"><a class="table__link" href="${buildPath(ROUTES.QUOTE, { id: quote.id })}">${quote.title}</a>
                    <span class="table__sub">${formatDate(quote.createdAt)}</span></td>
                  <td class="table__cell">${StatusBadge(quote.status)}</td>
                  <td class="table__cell table__cell--number table__cell--strong">${formatMoney(quote.totalMinor, quote.currency)}</td>
                </tr>`,
              )}
            </tbody></table></div>`
          : html`<p class="card__body customer-detail__muted">${c.noQuotes}</p>`}
      </section>
      <section class="card">
        <div class="card__body stack">
          ${customer.archived ? Badge(c.archived) : ''}
          <dl class="customer-detail__facts">
            ${contact.map(([label, value]) => html`<div class="customer-detail__fact"><dt class="customer-detail__term">${label}</dt><dd class="customer-detail__value">${value}</dd></div>`)}
          </dl>
        </div>
      </section>
    </div>
  `;
}

export async function CustomerDetailPage({ params }) {
  const el = createElement('div', 'page');
  let customer = null;
  const view = asyncView(
    el,
    async () => (customer = (await api.get(`/customers/${params.id}`)).data),
    Detail,
    { rows: 8 },
  );

  const setArchived = (archived) => async (_, button) =>
    withLoading(button, async () => {
      try {
        await (archived ? api.delete(`/customers/${params.id}`) : api.post(`/customers/${params.id}/restore`));
        showToast(archived ? copy.customers.archivedToast : copy.customers.restoredToast);
        await view.reload();
      } catch (error) {
        showToast(error.message, 'error');
      }
    });

  const offs = [
    on(el, 'click', '[data-action="edit"]', () => openCustomerForm(customer, () => void view.reload())),
    on(el, 'click', '[data-action="archive"]', setArchived(true)),
    on(el, 'click', '[data-action="restore"]', setArchived(false)),
  ];
  return { el, title: copy.customers.title, destroy: () => [view.destroy, ...offs].forEach((off) => off()) };
}

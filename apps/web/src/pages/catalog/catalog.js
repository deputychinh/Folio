import { CatalogUnit, enumValues, formatMoney, fromMinor, NAME_MAX, toMinor } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { asyncView } from '../../components/async-view/async-view.js';
import { Badge } from '../../components/badge/badge.js';
import { EmptyState } from '../../components/empty-state/empty-state.js';
import { Field, SelectField, TextareaField } from '../../components/field/field.js';
import { icons } from '../../components/icon/icon.js';
import { openModal } from '../../components/modal/modal.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { Pagination } from '../../components/pagination/pagination.js';
import { SearchInput } from '../../components/search/search.js';
import { currentWorkspaceCurrency } from '../../state/workspace.js';
import { showToast } from '../../state/toast.js';
import { bindListControls, readQuery } from '../../utils/list-query.js';

function openItemForm(item, currency, onSaved) {
  const c = copy.catalog;
  openModal({
    title: item ? c.edit : c.add,
    body: html`
      ${Field({ label: c.name, name: 'name', required: true, value: item?.name, maxlength: NAME_MAX })}
      ${TextareaField({ label: c.description, name: 'description', value: item?.description, optional: true, rows: 2, maxlength: 500 })}
      <div class="field-grid">
        ${SelectField({ label: c.unit, name: 'unit', value: item?.unit ?? CatalogUnit.HOUR, options: enumValues(CatalogUnit).map((u) => ({ value: u, label: copy.unit[u] })) })}
        ${Field({ label: `${c.unitPrice} (${currency})`, name: 'unitPrice', type: 'number', required: true, min: 0, step: 0.01, inputmode: 'decimal', value: item ? fromMinor(item.unitPriceMinor, currency) : '' })}
      </div>
      <label class="checkbox"><input class="checkbox__input" type="checkbox" name="active" value="true" ${!item || item.active ? html`checked` : ''} /> ${c.active}</label>
    `,
    onSubmit: async (values) => {
      const body = {
        name: values.name,
        description: values.description,
        unit: values.unit,
        unitPriceMinor: toMinor(values.unitPrice, currency),
        active: values.active === 'true',
      };
      await (item ? api.patch(`/catalog/${item.id}`, body) : api.post('/catalog', body));
      showToast(c.savedToast);
      onSaved();
    },
  });
}

function CatalogTable({ data, meta }, currency) {
  const c = copy.catalog;
  if (!data.length) {
    return EmptyState({ title: c.empty, text: c.emptyText, action: html`<button class="button button--primary" type="button" data-action="add">${icons.plus} ${c.add}</button>` });
  }
  return html`
    <div class="table-scroll">
      <table class="table">
        <thead><tr>
          <th class="table__head" scope="col">${c.name}</th>
          <th class="table__head table__head--optional" scope="col">${c.unit}</th>
          <th class="table__head table__head--number" scope="col">${c.unitPrice}</th>
          <th class="table__head" scope="col"><span class="visually-hidden">${copy.common.edit}</span></th>
        </tr></thead>
        <tbody>
          ${data.map(
            (item) => html`<tr class="table__row">
              <td class="table__cell">
                <span class="table__title">${item.name}</span> ${item.active ? '' : Badge(c.inactive)}
                ${item.description ? html`<span class="table__sub">${item.description}</span>` : ''}
              </td>
              <td class="table__cell table__cell--optional">${copy.unit[item.unit]}</td>
              <td class="table__cell table__cell--number">${formatMoney(item.unitPriceMinor, currency)}</td>
              <td class="table__cell table__cell--number">
                <button class="button button--ghost button--small" type="button" data-edit="${item.id}">${copy.common.edit}</button>
              </td>
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
    ${Pagination(meta)}
  `;
}

export async function CatalogPage({ query }) {
  const c = copy.catalog;
  const filters = readQuery(query, ['search', 'page']);
  const currency = await currentWorkspaceCurrency();
  let items = [];

  const el = createElement('div', 'page');
  render(
    el,
    html`
      ${PageHeader({ eyebrow: c.eyebrow, title: c.title, lead: c.lead, actions: html`<button class="button button--primary" type="button" data-action="add">${icons.plus} ${c.add}</button>` })}
      <section class="card">
        <div class="toolbar">${SearchInput({ label: copy.common.search, placeholder: c.searchPlaceholder, value: filters.search })}</div>
        <div data-body></div>
      </section>
    `,
  );

  const view = asyncView(
    el.querySelector('[data-body]'),
    async () => {
      const result = await api.get('/catalog', filters);
      items = result.data;
      return result;
    },
    (result) => CatalogTable(result, currency),
    { rows: 8 },
  );
  const offs = [
    bindListControls(el),
    on(el, 'click', '[data-action="add"]', () => openItemForm(null, currency, () => void view.reload())),
    on(el, 'click', '[data-edit]', (_, button) => openItemForm(items.find((i) => i.id === button.dataset.edit), currency, () => void view.reload())),
  ];
  return { el, title: c.title, destroy: () => [view.destroy, ...offs].forEach((off) => off()) };
}

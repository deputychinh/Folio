// Line-item rows of the quote editor: markup, reading values back, and the catalog picker.
import { CatalogUnit, enumValues, formatMoney, fromMinor, NAME_MAX, QUANTITY_MAX, toMinor } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { html, on, render } from '../../core/dom.js';
import { icons } from '../../components/icon/icon.js';
import { openModal } from '../../components/modal/modal.js';

/** @typedef {{ catalogItemId?: string | null, name: string, unit: string, quantity: number, unitPriceMinor: number }} ItemInput */

let rowCounter = 0;

/** @param {ItemInput} item @param {string} currency */
export function ItemRow(item, currency) {
  const id = ++rowCounter;
  const price = item.unitPriceMinor ? fromMinor(item.unitPriceMinor, currency) : '';
  return html`
    <tr class="line-items__row" data-row data-catalog-id="${item.catalogItemId ?? ''}">
      <td class="line-items__cell line-items__cell--name">
        <label class="visually-hidden" for="item-name-${id}">${copy.editor.itemName}</label>
        <input class="line-items__input" id="item-name-${id}" data-item="name" value="${item.name}" maxlength="${NAME_MAX}" required />
      </td>
      <td class="line-items__cell line-items__cell--qty">
        <label class="visually-hidden" for="item-qty-${id}">${copy.editor.quantity}</label>
        <input class="line-items__input line-items__input--number" id="item-qty-${id}" data-item="quantity" type="number"
          value="${item.quantity}" min="0.01" max="${QUANTITY_MAX}" step="0.01" inputmode="decimal" required />
      </td>
      <td class="line-items__cell line-items__cell--unit">
        <label class="visually-hidden" for="item-unit-${id}">${copy.editor.unit}</label>
        <select class="line-items__input" id="item-unit-${id}" data-item="unit">
          ${enumValues(CatalogUnit).map((unit) => html`<option value="${unit}" ${unit === item.unit ? html`selected` : ''}>${copy.unit[unit]}</option>`)}
        </select>
      </td>
      <td class="line-items__cell line-items__cell--price">
        <label class="visually-hidden" for="item-price-${id}">${copy.editor.unitPrice}</label>
        <input class="line-items__input line-items__input--number" id="item-price-${id}" data-item="price" type="number"
          value="${price}" min="0" step="0.01" inputmode="decimal" required />
      </td>
      <td class="line-items__cell line-items__cell--amount" data-amount></td>
      <td class="line-items__cell line-items__cell--remove">
        <button class="button button--ghost button--icon button--small" type="button" data-remove-row aria-label="${copy.editor.removeItem}" title="${copy.editor.removeItem}">
          ${icons.trash}
        </button>
      </td>
    </tr>
  `;
}

export function blankItem() {
  return { name: '', unit: CatalogUnit.ITEM, quantity: 1, unitPriceMinor: 0 };
}

/** Read every row back into API items (prices in minor units). */
export function readItems(tbody, currency) {
  return [...tbody.querySelectorAll('[data-row]')].map((row) => {
    const field = (name) => row.querySelector(`[data-item="${name}"]`).value.trim();
    return {
      catalogItemId: row.dataset.catalogId || null,
      name: field('name'),
      unit: field('unit'),
      quantity: Number(field('quantity')) || 0,
      unitPriceMinor: toMinor(field('price') || 0, currency),
    };
  });
}

/** Write each row's amount without touching the inputs (keeps focus and caret). */
export function showLineAmounts(tbody, lineTotals, currency) {
  tbody.querySelectorAll('[data-amount]').forEach((cell, i) => {
    cell.textContent = formatMoney(lineTotals[i] ?? 0, currency);
  });
}

/** Modal listing active catalog items; resolves with the chosen item or null. */
export function pickCatalogItem(currency) {
  return new Promise((resolve) => {
    let chosen = null;
    const { dialog, close } = openModal({
      title: copy.catalog.pickTitle,
      wide: true,
      body: html`<div data-picker><p>${copy.common.loading}</p></div>`,
    });
    const container = dialog.querySelector('[data-picker]');

    api
      .get('/catalog', { activeOnly: true, pageSize: 100 })
      .then(({ data }) => {
        render(container, data.length ? CatalogList(data, currency) : html`<p>${copy.catalog.empty}</p>`);
        on(container, 'click', '[data-pick]', (_, button) => {
          chosen = data.find((item) => item.id === button.dataset.pick) ?? null;
          close();
        });
      })
      .catch((error) => {
        container.textContent = error.message;
      });

    dialog.addEventListener('close', () => resolve(chosen));
  });
}

function CatalogList(items, currency) {
  return html`<ul class="catalog-picker" role="list">
    ${items.map(
      (item) => html`<li>
        <button class="catalog-picker__item" type="button" data-pick="${item.id}">
          <span class="catalog-picker__name">${item.name}</span>
          <span class="catalog-picker__description">${item.description}</span>
          <span class="catalog-picker__price">${formatMoney(item.unitPriceMinor, currency)} / ${copy.unit[item.unit]}</span>
        </button>
      </li>`,
    )}
  </ul>`;
}

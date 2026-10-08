// Editing a DRAFT quote: form on the left, live document preview on the right,
// autosave while typing. Totals use the same calcQuoteTotals as the API.
import {
  addDays,
  AUTOSAVE_DELAY_MS,
  calcLineTotal,
  calcQuoteTotals,
  DiscountType,
  enumValues,
  fromMinor,
  QUOTE_NOTES_MAX,
  QUOTE_TITLE_MAX,
  QUOTE_VALID_DAYS_DEFAULT,
  ROUTES,
  TAX_PERCENT_MAX,
  toIsoDate,
  toMinor,
} from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { append, html, on, readForm, render } from '../../core/dom.js';
import { buildPath, navigate } from '../../core/router.js';
import { withLoading } from '../../components/button/button.js';
import { Field, SelectField, TextareaField } from '../../components/field/field.js';
import { icons } from '../../components/icon/icon.js';
import { applyDocumentAccent, QuoteDocument } from '../../components/quote-document/quote-document.js';
import { showToast } from '../../state/toast.js';
import { debounce } from '../../utils/debounce.js';
import { blankItem, ItemRow, pickCatalogItem, readItems, showLineAmounts } from './line-items.js';
import { showLinkModal } from './share-link.js';

function EditorForm({ quote, customers, currency, customerId }) {
  const discountValue = quote.discountType === DiscountType.AMOUNT ? fromMinor(quote.discountValue, currency) : quote.discountValue;
  return html`
    <form class="quote-editor" novalidate data-form>
      <div class="quote-editor__main">
        <section class="card">
          <header class="card__header"><h2 class="card__title">${copy.editor.details}</h2></header>
          <div class="card__body field-grid">
            ${SelectField({
              label: copy.editor.customer,
              name: 'customerId',
              required: true,
              value: customerId,
              placeholder: copy.editor.chooseCustomer,
              hint: copy.editor.newCustomerHint,
              options: customers.map((c) => ({ value: c.id, label: c.companyName })),
            })}
            ${Field({ label: copy.editor.validUntil, name: 'validUntil', type: 'date', required: true, value: quote.validUntil, min: toIsoDate(new Date()) })}
            ${Field({ label: copy.editor.quoteTitle, name: 'title', required: true, value: quote.title, maxlength: QUOTE_TITLE_MAX, wide: true })}
          </div>
        </section>

        <section class="card">
          <header class="card__header">
            <h2 class="card__title">${copy.editor.items}</h2>
            <div class="cluster">
              <button class="button button--small" type="button" data-action="add-catalog">${icons.catalog} ${copy.editor.addFromCatalog}</button>
              <button class="button button--small" type="button" data-action="add-item">${icons.plus} ${copy.editor.addItem}</button>
            </div>
          </header>
          <div class="card__body quote-editor__items">
            <table class="line-items">
              <colgroup class="line-items__cols">
                <col />
                <col class="line-items__col line-items__col--qty" />
                <col class="line-items__col line-items__col--unit" />
                <col class="line-items__col line-items__col--price" />
                <col class="line-items__col line-items__col--amount" />
                <col class="line-items__col line-items__col--remove" />
              </colgroup>
              <thead class="line-items__header">
                <tr>
                  <th class="line-items__head" scope="col">${copy.editor.itemName}</th>
                  <th class="line-items__head line-items__head--number" scope="col">${copy.editor.quantity}</th>
                  <th class="line-items__head" scope="col">${copy.editor.unit}</th>
                  <th class="line-items__head line-items__head--number" scope="col">${copy.editor.unitPrice}</th>
                  <th class="line-items__head line-items__head--number" scope="col">${copy.editor.lineTotal}</th>
                  <th class="line-items__head" scope="col"><span class="visually-hidden">${copy.editor.removeItem}</span></th>
                </tr>
              </thead>
              <tbody class="line-items__body" data-items>${quote.items.map((item) => ItemRow(item, currency))}</tbody>
            </table>
            <p class="quote-editor__empty" data-items-empty hidden>${copy.editor.noItems}</p>
          </div>
        </section>

        <section class="card">
          <header class="card__header"><h2 class="card__title">${copy.editor.adjustments}</h2></header>
          <div class="card__body field-grid">
            ${SelectField({
              label: copy.editor.discountType,
              name: 'discountType',
              value: quote.discountType,
              options: enumValues(DiscountType).map((value) => ({ value, label: copy.discountType[value] })),
            })}
            ${Field({ label: copy.editor.discount, name: 'discountValue', type: 'number', value: discountValue, min: 0, step: 0.01, inputmode: 'decimal' })}
            ${Field({ label: copy.editor.tax, name: 'taxPercent', type: 'number', value: quote.taxPercent, min: 0, max: TAX_PERCENT_MAX, step: 0.01, inputmode: 'decimal' })}
          </div>
        </section>

        <section class="card">
          <div class="card__body">
            ${TextareaField({ label: copy.editor.notes, name: 'notes', value: quote.notes, hint: copy.editor.notesHint, maxlength: QUOTE_NOTES_MAX, optional: true })}
          </div>
        </section>
      </div>

      <aside class="quote-editor__aside" aria-label="${copy.editor.preview}">
        <div class="quote-editor__sticky">
          <p class="quote-editor__status" data-save-status aria-live="polite"></p>
          <div data-preview></div>
        </div>
      </aside>
    </form>
  `;
}

/**
 * @param {HTMLElement} container
 * @param {{ quote: any | null, customers: any[], workspace: any, customerId?: string }} data
 * @returns {{ destroy: () => void }}
 */
export function mountDraftEditor(container, { quote, customers, workspace, customerId }) {
  const currency = quote?.currency ?? workspace.currency;
  const initial = quote ?? {
    title: '',
    validUntil: addDays(toIsoDate(new Date()), QUOTE_VALID_DAYS_DEFAULT),
    items: [blankItem()],
    discountType: DiscountType.PERCENT,
    discountValue: 0,
    taxPercent: workspace.taxPercent,
    notes: '',
  };
  render(container, EditorForm({ quote: initial, customers, currency, customerId: quote?.customerId ?? customerId ?? '' }));

  const form = /** @type {HTMLFormElement} */ (container.querySelector('[data-form]'));
  const tbody = form.querySelector('[data-items]');
  const preview = form.querySelector('[data-preview]');
  const status = form.querySelector('[data-save-status]');

  let quoteId = quote?.id ?? null;
  let number = quote?.number ?? '';
  let dirty = false;
  let saving = null;
  let saveAgain = false;

  const setStatus = (text, tone = '') => {
    status.textContent = text;
    status.className = `quote-editor__status${tone ? ` quote-editor__status--${tone}` : ''}`;
  };

  function readDraft() {
    const values = readForm(form);
    const discountType = values.discountType;
    return {
      customerId: values.customerId,
      title: values.title,
      validUntil: values.validUntil,
      items: readItems(tbody, currency),
      discountType,
      discountValue: discountType === DiscountType.PERCENT ? Number(values.discountValue) || 0 : toMinor(values.discountValue || 0, currency),
      taxPercent: Number(values.taxPercent) || 0,
      notes: values.notes ?? '',
    };
  }

  const isSaveable = (draft) =>
    Boolean(draft.customerId && draft.title && draft.validUntil) && draft.items.every((item) => item.name && item.quantity > 0);

  function refresh() {
    const draft = readDraft();
    const lineTotals = draft.items.map(calcLineTotal);
    const totals = calcQuoteTotals(draft.items, { type: draft.discountType, value: draft.discountValue }, draft.taxPercent);
    showLineAmounts(tbody, lineTotals, currency);
    /** @type {HTMLElement} */ (form.querySelector('[data-items-empty]')).hidden = draft.items.length > 0;
    const customer = customers.find((c) => c.id === draft.customerId);
    render(
      preview,
      QuoteDocument(
        {
          ...draft,
          ...totals,
          number,
          currency,
          items: draft.items.map((item, i) => ({ ...item, lineTotalMinor: lineTotals[i] })),
          seller: { name: workspace.name, brandAccent: workspace.brandAccent },
          customer: { companyName: customer?.companyName ?? '', contactName: customer?.contactName ?? '' },
        },
        { compact: true },
      ),
    );
    applyDocumentAccent(preview);
  }

  /** Save the draft now. Resolves true when the server has the latest version. */
  async function save({ explicit = false } = {}) {
    if (saving) {
      saveAgain = true;
      return saving;
    }
    const draft = readDraft();
    if (!isSaveable(draft)) {
      setStatus(copy.editor.unsaved);
      if (explicit) form.reportValidity();
      return false;
    }
    setStatus(copy.common.saving);
    saving = (quoteId ? api.put(`/quotes/${quoteId}`, draft) : api.post('/quotes', draft))
      .then(({ data }) => {
        if (!quoteId) {
          quoteId = data.id;
          number = data.number;
          history.replaceState(null, '', buildPath(ROUTES.QUOTE, { id: quoteId }));
        }
        dirty = false;
        setStatus(copy.editor.autosaved, 'saved');
        refresh();
        return true;
      })
      .catch((error) => {
        setStatus(error.message, 'error');
        if (explicit) showToast(error.message, 'error');
        return false;
      })
      .finally(() => {
        saving = null;
        if (saveAgain) {
          saveAgain = false;
          void save();
        }
      });
    return saving;
  }

  const scheduleSave = debounce(() => void save(), AUTOSAVE_DELAY_MS);

  function changed() {
    dirty = true;
    setStatus(copy.editor.unsaved);
    refresh();
    scheduleSave();
  }

  function addRow(item) {
    append(tbody, ItemRow(item, currency));
    changed();
    /** @type {HTMLInputElement | null} */ (tbody.querySelector('[data-row]:last-child [data-item="name"]'))?.focus();
  }

  async function send(button) {
    await withLoading(button, async () => {
      scheduleSave.cancel();
      if ((dirty || !quoteId) && !(await save({ explicit: true }))) return;
      try {
        const { data } = await api.post(`/quotes/${quoteId}/send`);
        showLinkModal({
          title: copy.editor.sendTitle,
          lead: copy.editor.sendLead,
          url: data.shareUrl,
          onClose: () => navigate(buildPath(ROUTES.QUOTE, { id: quoteId }), { replace: true }),
        });
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }

  const page = container.closest('.page') ?? container;
  const offs = [
    on(form, 'input', 'input, textarea', changed),
    on(form, 'change', 'select', changed),
    on(form, 'submit', 'form', (event) => event.preventDefault()),
    on(form, 'click', '[data-action="add-item"]', () => addRow(blankItem())),
    on(form, 'click', '[data-action="add-catalog"]', async () => {
      const item = await pickCatalogItem(currency);
      if (item) addRow({ catalogItemId: item.id, name: item.name, unit: item.unit, quantity: 1, unitPriceMinor: item.unitPriceMinor });
    }),
    on(form, 'click', '[data-remove-row]', (_, button) => {
      button.closest('[data-row]').remove();
      changed();
    }),
    on(page, 'click', '[data-action="save"]', (_, button) => withLoading(button, () => save({ explicit: true }))),
    on(page, 'click', '[data-action="send"]', (_, button) => send(button)),
  ];

  refresh();
  if (quote) setStatus(copy.editor.autosaved, 'saved');

  return {
    destroy() {
      scheduleSave.cancel();
      if (dirty) void save(); // keep the last keystrokes when leaving the page
      offs.forEach((off) => off());
    },
  };
}

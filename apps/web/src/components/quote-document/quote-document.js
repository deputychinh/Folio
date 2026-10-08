// A quote laid out like a printed proposal. One component for the live
// preview in the editor, the sent quote, and the client's public page.
import { DiscountType, formatDate, formatMoney, formatPercent } from '@folio/shared';
import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

/**
 * @typedef {{
 *   number: string, title: string, currency: string, validUntil: string, issuedAt?: string | null,
 *   notes?: string, discountType: string, discountValue: number, taxPercent: number,
 *   subtotalMinor: number, discountMinor: number, taxMinor: number, totalMinor: number,
 *   items: { name: string, unit: string, quantity: number, unitPriceMinor: number, lineTotalMinor: number }[],
 *   seller: { name: string, brandAccent?: string | null }, customer: { companyName: string, contactName?: string },
 * }} QuoteDocumentData
 */

const HEX = /^#[0-9a-f]{6}$/i;

/** @param {QuoteDocumentData} quote @param {{ compact?: boolean }} [options] */
export function QuoteDocument(quote, { compact = false } = {}) {
  const money = (minor) => formatMoney(minor, quote.currency);
  const discountLabel =
    quote.discountType === DiscountType.PERCENT && quote.discountValue
      ? `${copy.editor.discountLine} (${formatPercent(quote.discountValue)})`
      : copy.editor.discountLine;

  return html`
    <article class="quote-document${compact ? ' quote-document--compact' : ''}" data-accent="${quote.seller.brandAccent ?? ''}">
      <header class="quote-document__header">
        <div>
          <p class="quote-document__seller">${quote.seller.name}</p>
          <h2 class="quote-document__title">${quote.title || copy.editor.newTitle}</h2>
        </div>
        <dl class="quote-document__meta">
          <div><dt class="quote-document__meta-term">${copy.publicQuote.quoteNumber}</dt><dd class="quote-document__meta-value">${quote.number || '—'}</dd></div>
          ${quote.issuedAt ? html`<div><dt class="quote-document__meta-term">${copy.publicQuote.issued}</dt><dd class="quote-document__meta-value">${formatDate(quote.issuedAt)}</dd></div>` : ''}
          <div><dt class="quote-document__meta-term">${copy.publicQuote.validUntil}</dt><dd class="quote-document__meta-value">${quote.validUntil ? formatDate(quote.validUntil) : '—'}</dd></div>
        </dl>
      </header>

      <section class="quote-document__parties">
        <div>
          <p class="quote-document__label">${copy.publicQuote.preparedFor}</p>
          <p class="quote-document__party">${quote.customer.companyName || '—'}</p>
          ${quote.customer.contactName ? html`<p class="quote-document__contact">${quote.customer.contactName}</p>` : ''}
        </div>
        <div>
          <p class="quote-document__label">${copy.publicQuote.preparedBy}</p>
          <p class="quote-document__party">${quote.seller.name}</p>
        </div>
      </section>

      <table class="quote-document__items">
        <thead>
          <tr>
            <th class="quote-document__th" scope="col">${copy.editor.itemName}</th>
            <th class="quote-document__th quote-document__th--number" scope="col">${copy.editor.quantity}</th>
            <th class="quote-document__th quote-document__th--number" scope="col">${copy.editor.unitPrice}</th>
            <th class="quote-document__th quote-document__th--number" scope="col">${copy.editor.lineTotal}</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map(
            (item) => html`<tr>
              <td class="quote-document__td">${item.name || '—'}</td>
              <td class="quote-document__td quote-document__td--number">${item.quantity} ${copy.unit[item.unit] ?? ''}</td>
              <td class="quote-document__td quote-document__td--number">${money(item.unitPriceMinor)}</td>
              <td class="quote-document__td quote-document__td--number">${money(item.lineTotalMinor)}</td>
            </tr>`,
          )}
        </tbody>
      </table>

      <dl class="quote-document__totals">
        <div class="quote-document__line"><dt class="quote-document__term">${copy.editor.subtotal}</dt><dd class="quote-document__amount">${money(quote.subtotalMinor)}</dd></div>
        ${quote.discountMinor ? html`<div class="quote-document__line"><dt class="quote-document__term">${discountLabel}</dt><dd class="quote-document__amount">− ${money(quote.discountMinor)}</dd></div>` : ''}
        ${quote.taxPercent ? html`<div class="quote-document__line"><dt class="quote-document__term">${copy.editor.taxLine(formatPercent(quote.taxPercent))}</dt><dd class="quote-document__amount">${money(quote.taxMinor)}</dd></div>` : ''}
        <div class="quote-document__line quote-document__line--total"><dt class="quote-document__term">${copy.editor.total}</dt><dd class="quote-document__amount">${money(quote.totalMinor)}</dd></div>
      </dl>

      ${quote.notes ? html`<section class="quote-document__notes"><p class="quote-document__label">${copy.editor.notes}</p><p>${quote.notes}</p></section>` : ''}
    </article>
  `;
}

/**
 * Apply each document's workspace accent colour. Done in JS because the CSP
 * forbids inline style attributes. Only a validated hex colour is used.
 */
export function applyDocumentAccent(root) {
  root.querySelectorAll('.quote-document[data-accent]').forEach((element) => {
    const accent = element.getAttribute('data-accent');
    if (HEX.test(accent)) element.style.setProperty('--quote-document-accent', accent);
  });
}

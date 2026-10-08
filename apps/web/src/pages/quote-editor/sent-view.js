// A quote that has left DRAFT: read-only document, status, link and activity.
import { formatDate, isOpen, ROUTES } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { html, on, render } from '../../core/dom.js';
import { buildPath, navigate, reload } from '../../core/router.js';
import { ActivityList } from '../../components/activity/activity.js';
import { withLoading } from '../../components/button/button.js';
import { StatusBadge } from '../../components/badge/badge.js';
import { icons } from '../../components/icon/icon.js';
import { applyDocumentAccent, QuoteDocument } from '../../components/quote-document/quote-document.js';
import { showToast } from '../../state/toast.js';
import { showLinkModal } from './share-link.js';

function Timeline(quote) {
  const rows = [
    [copy.status.sent, quote.sentAt],
    [copy.status.viewed, quote.viewedAt],
    [quote.status === 'declined' ? copy.status.declined : copy.status.accepted, quote.respondedAt],
  ].filter(([, date]) => date);
  return html`
    <dl class="quote-status__dates">
      ${rows.map(([label, date]) => html`<div class="quote-status__row"><dt class="quote-status__term">${label}</dt><dd class="quote-status__value">${formatDate(date)}</dd></div>`)}
    </dl>
  `;
}

export function mountSentView(container, { quote, workspace, events }) {
  render(
    container,
    html`
      <div class="grid grid--sidebar">
        <div data-document>
          ${QuoteDocument({
            ...quote,
            issuedAt: quote.sentAt,
            seller: { name: workspace.name, brandAccent: workspace.brandAccent },
            customer: { companyName: quote.customerName, contactName: '' },
          })}
        </div>
        <aside class="stack">
          <section class="card quote-status">
            <div class="card__body stack">
              <div class="cluster cluster--between">${StatusBadge(quote.status)}</div>
              ${Timeline(quote)}
              ${quote.clientName ? html`<p class="quote-status__answer">${copy.editor.clientAnswer(quote.clientName)}</p>` : ''}
              ${quote.declineReason
                ? html`<blockquote class="quote-status__reason"><span class="quote-status__label">${copy.editor.declineReason}</span>${quote.declineReason}</blockquote>`
                : ''}
              <p class="form-message">${copy.editor.readOnly}</p>
              <div class="cluster">
                ${isOpen(quote.status) ? html`<button class="button button--primary" type="button" data-action="resend">${icons.link} ${copy.editor.resend}</button>` : ''}
                <button class="button" type="button" data-action="duplicate">${icons.copy} ${copy.editor.duplicate}</button>
              </div>
            </div>
          </section>
          <section class="card">
            <header class="card__header"><h2 class="card__title">${copy.editor.activity}</h2></header>
            <div class="card__body">${ActivityList(events, { quoteNumber: quote.number, linkQuotes: false })}</div>
          </section>
        </aside>
      </div>
    `,
  );
  applyDocumentAccent(container);

  const offs = [
    on(container, 'click', '[data-action="resend"]', (_, button) =>
      withLoading(button, async () => {
        try {
          const { data } = await api.post(`/quotes/${quote.id}/send`);
          showLinkModal({ title: copy.editor.sendTitle, lead: copy.editor.sendLead, url: data.shareUrl, onClose: reload });
        } catch (error) {
          showToast(error.message, 'error');
        }
      }),
    ),
    on(container, 'click', '[data-action="duplicate"]', (_, button) =>
      withLoading(button, async () => {
        try {
          const { data } = await api.post(`/quotes/${quote.id}/duplicate`);
          navigate(buildPath(ROUTES.QUOTE, { id: data.id }));
        } catch (error) {
          showToast(error.message, 'error');
        }
      }),
    ),
  ];
  return { destroy: () => offs.forEach((off) => off()) };
}

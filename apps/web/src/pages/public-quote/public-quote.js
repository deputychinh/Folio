// /q/:token — what the client sees. No account, no app chrome: just the
// document, a print button and the accept / decline form.
import { DECLINE_REASON_MAX, ErrorCode, formatDate, isOpen, NAME_MAX, QuoteStatus } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, readForm, render } from '../../core/dom.js';
import { withLoading } from '../../components/button/button.js';
import { ErrorState } from '../../components/empty-state/empty-state.js';
import { Field, showFormMessage, TextareaField } from '../../components/field/field.js';
import { icons } from '../../components/icon/icon.js';
import { applyDocumentAccent, QuoteDocument } from '../../components/quote-document/quote-document.js';
import { Skeleton } from '../../components/skeleton/skeleton.js';

const p = copy.publicQuote;

function Outcome(quote) {
  if (quote.status === QuoteStatus.ACCEPTED) {
    return html`<div class="public-quote__outcome public-quote__outcome--accepted" role="status">
      <h2 class="public-quote__outcome-title">${icons.check} ${p.acceptedTitle}</h2>
      <p>${p.acceptedText(quote.clientName, formatDate(quote.respondedAt))}</p>
    </div>`;
  }
  if (quote.status === QuoteStatus.DECLINED) {
    return html`<div class="public-quote__outcome public-quote__outcome--declined" role="status">
      <h2 class="public-quote__outcome-title">${p.declinedTitle}</h2>
      <p>${p.declinedText(quote.clientName, formatDate(quote.respondedAt))}</p>
    </div>`;
  }
  return html`<div class="public-quote__outcome public-quote__outcome--expired" role="status">
    <h2 class="public-quote__outcome-title">${p.expiredTitle}</h2>
    <p>${p.expiredText}</p>
  </div>`;
}

function ResponseForm() {
  return html`
    <form class="public-quote__respond" novalidate data-respond>
      <h2 class="public-quote__respond-title">${p.respondTitle}</h2>
      <p class="public-quote__respond-lead">${p.respondLead}</p>
      <p class="form-message form-message--error" data-message hidden></p>
      ${Field({ label: p.yourName, name: 'clientName', required: true, autocomplete: 'name', maxlength: NAME_MAX, minlength: 2 })}
      <label class="checkbox"><input class="checkbox__input" type="checkbox" name="agree" value="yes" required /> ${p.agree}</label>
      <div class="public-quote__decline" data-decline hidden>
        ${TextareaField({ label: p.declineReason, name: 'declineReason', rows: 3, maxlength: DECLINE_REASON_MAX })}
      </div>
      <div class="cluster">
        <button class="button button--accent" type="submit" data-answer="accept">${p.accept}</button>
        <button class="button" type="button" data-answer="decline">${p.decline}</button>
      </div>
    </form>
  `;
}

function PublicQuote(quote) {
  return html`
    <div class="public-quote__bar">
      <span class="public-quote__seller">${quote.seller.name}</span>
      <button class="button button--small" type="button" data-print>${icons.printer} ${p.print}</button>
    </div>
    ${QuoteDocument({ ...quote, issuedAt: quote.sentAt })}
    ${isOpen(quote.status) ? ResponseForm() : Outcome(quote)}
    <p class="public-quote__footer">${p.poweredBy}</p>
  `;
}

export async function PublicQuotePage({ params }) {
  const el = createElement('main', 'public-quote');
  el.id = 'main-content';
  const path = `/public/quotes/${encodeURIComponent(params.token)}`;
  let title = p.quoteNumber;

  const draw = (quote) => {
    render(el, PublicQuote(quote));
    applyDocumentAccent(el);
    title = `${quote.title} · ${quote.seller.name}`;
  };

  render(el, Skeleton({ rows: 10 }));
  try {
    draw((await api.get(path)).data);
  } catch (error) {
    render(
      el,
      error.code === ErrorCode.NOT_FOUND
        ? html`<div class="public-quote__outcome"><h1 class="public-quote__outcome-title">${p.notFoundTitle}</h1><p>${p.notFoundText}</p></div>`
        : ErrorState(error),
    );
  }

  let declining = false;
  const offs = [
    on(el, 'click', '[data-print]', () => window.print()),
    on(el, 'click', '[data-action="retry"]', () => window.location.reload()),
    on(el, 'click', '[data-answer="decline"]', async (_, button) => {
      const form = button.closest('form');
      if (!declining) {
        declining = true;
        form.querySelector('[data-decline]').hidden = false;
        form.querySelector('[name=agree]').required = false;
        button.textContent = p.confirmDecline;
        button.classList.add('button--danger');
        form.querySelector('[name=declineReason]').focus();
        return;
      }
      await respond(form, button, false);
    }),
    on(el, 'submit', '[data-respond]', async (event, form) => {
      event.preventDefault();
      form.querySelector('[name=agree]').required = true;
      await respond(form, form.querySelector('[data-answer="accept"]'), true);
    }),
  ];

  async function respond(form, button, accept) {
    if (!form.checkValidity()) return form.reportValidity();
    const { clientName, declineReason } = readForm(form);
    try {
      await withLoading(button, async () => {
        const { data } = await api.post(`${path}/respond`, { accept, clientName, declineReason: accept ? undefined : declineReason });
        draw(data);
        el.querySelector('[role=status]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } catch (error) {
      showFormMessage(form.querySelector('[data-message]'), error.message);
    }
  }

  return { el, title, destroy: () => offs.forEach((off) => off()) };
}

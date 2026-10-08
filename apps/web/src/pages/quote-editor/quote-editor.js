// /quotes/new and /quotes/:id. Loads what the editor needs, then shows the
// draft editor or, once sent, the read-only view.
import { isEditable } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { ErrorState } from '../../components/empty-state/empty-state.js';
import { StatusBadge } from '../../components/badge/badge.js';
import { icons } from '../../components/icon/icon.js';
import { PageHeader } from '../../components/page-header/page-header.js';
import { Skeleton } from '../../components/skeleton/skeleton.js';
import { loadWorkspace } from '../../state/workspace.js';
import { mountDraftEditor } from './draft-editor.js';
import { mountSentView } from './sent-view.js';

async function loadData(id) {
  const [quote, events, customers, workspace] = await Promise.all([
    id ? api.get(`/quotes/${id}`).then((r) => r.data) : null,
    id ? api.get(`/quotes/${id}/events`).then((r) => r.data) : [],
    api.get('/customers', { pageSize: 100 }).then((r) => r.data),
    loadWorkspace(),
  ]);
  // A draft may point to a customer that was archived since; keep it selectable.
  if (quote && !customers.some((c) => c.id === quote.customerId)) {
    customers.push({ id: quote.customerId, companyName: quote.customerName, contactName: '' });
  }
  return { quote, events, customers, workspace };
}

function Header(quote) {
  const draft = !quote || isEditable(quote.status);
  return PageHeader({
    eyebrow: quote ? html`${copy.editor.eyebrow} · ${quote.number} ${StatusBadge(quote.status)}` : copy.editor.eyebrow,
    title: quote?.title || copy.editor.newTitle,
    actions: draft
      ? html`
          <button class="button" type="button" data-action="save">${copy.editor.saveDraft}</button>
          <button class="button button--accent" type="button" data-action="send">${icons.link} ${copy.editor.send}</button>
        `
      : '',
  });
}

export async function QuoteEditorPage({ params, query }) {
  const el = createElement('div', 'page page--wide');
  let mounted = null;

  async function load() {
    render(el, Skeleton({ rows: 10 }));
    try {
      const data = await loadData(params.id);
      render(el, html`${Header(data.quote)}<div data-body></div>`);
      const body = el.querySelector('[data-body]');
      mounted =
        !data.quote || isEditable(data.quote.status)
          ? mountDraftEditor(body, { ...data, customerId: query.get('customer') ?? undefined })
          : mountSentView(body, data);
    } catch (error) {
      render(el, ErrorState(error));
    }
  }

  const offRetry = on(el, 'click', '[data-action="retry"]', () => void load());
  await load();
  return {
    el,
    title: params.id ? copy.editor.eyebrow : copy.editor.newTitle,
    destroy() {
      offRetry();
      mounted?.destroy();
    },
  };
}

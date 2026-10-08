import { ROUTES } from '@folio/shared';
import { copy } from '../../core/copy.js';
import { createElement, html, render } from '../../core/dom.js';
import { EmptyState } from '../../components/empty-state/empty-state.js';

export async function NotFoundPage() {
  const el = createElement('main', 'page page--narrow');
  render(
    el,
    html`<h1 class="visually-hidden">${copy.notFound.title}</h1>
      ${EmptyState({ title: copy.notFound.title, text: copy.notFound.text, action: html`<a class="button button--primary" href="${ROUTES.DASHBOARD}">${copy.notFound.home}</a>` })}`,
  );
  return { el, title: copy.notFound.title };
}

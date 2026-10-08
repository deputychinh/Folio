import { ROUTES } from '@folio/shared';
import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';
import { buildPath } from '../../core/router.js';
import { formatRelativeTime } from '../../utils/relative-time.js';

/**
 * @param {{ type: string, actorName: string | null, createdAt: string, quoteNumber?: string, quoteId?: string }[]} items
 * @param {{ quoteNumber?: string, linkQuotes?: boolean }} [options]
 */
export function ActivityList(items, { quoteNumber, linkQuotes = true } = {}) {
  return html`
    <ol class="activity" role="list">
      ${items.map((item) => {
        const number = item.quoteNumber ?? quoteNumber ?? '';
        const text = copy.event[item.type](number, item.actorName);
        return html`
          <li class="activity__item activity__item--${item.type}">
            <span class="activity__dot" aria-hidden="true"></span>
            <span class="activity__text">
              ${linkQuotes && item.quoteId
                ? html`<a class="activity__link" href="${buildPath(ROUTES.QUOTE, { id: item.quoteId })}">${text}</a>`
                : text}
            </span>
            <time class="activity__time" datetime="${item.createdAt}" title="${new Date(item.createdAt).toLocaleString('en')}">
              ${formatRelativeTime(item.createdAt)}
            </time>
          </li>
        `;
      })}
    </ol>
  `;
}

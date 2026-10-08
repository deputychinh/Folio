import { copy } from '../../core/copy.js';
import { createElement, html, on, render } from '../../core/dom.js';
import { dismissToast, toasts } from '../../state/toast.js';
import { icons } from '../icon/icon.js';

/** Mount the toast region once; it re-renders when the toast store changes. */
export function mountToasts(parent) {
  const region = createElement('div', 'toast-region');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  parent.append(region);

  const draw = ({ items }) =>
    render(
      region,
      html`${items.map(
        (toast) => html`
          <div class="toast toast--${toast.tone}">
            <span class="toast__message">${toast.message}</span>
            <button class="toast__close" type="button" data-dismiss="${toast.id}" aria-label="${copy.common.close}">${icons.close}</button>
          </div>
        `,
      )}`,
    );

  on(region, 'click', '[data-dismiss]', (_, button) => dismissToast(Number(button.dataset.dismiss)));
  toasts.subscribe(draw);
  draw(toasts.get());
}

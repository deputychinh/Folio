// Modal dialogs on the native <dialog> element: the browser makes the page
// behind it inert, closes on Esc and returns focus to the trigger.
import { copy } from '../../core/copy.js';
import { createElement, html, readForm, render } from '../../core/dom.js';
import { withLoading } from '../button/button.js';
import { clearFieldErrors, showApiFieldErrors } from '../field/field.js';
import { icons } from '../icon/icon.js';

/**
 * Open a dialog. With `onSubmit`, the body is wrapped in a form; the dialog
 * closes when onSubmit resolves and shows the error when it throws.
 * @param {{ title: string, body: ReturnType<typeof html>, submitLabel?: string, danger?: boolean,
 *   wide?: boolean, onSubmit?: (values: Record<string, any>, form: HTMLFormElement) => Promise<void>,
 *   onOpen?: (dialog: HTMLDialogElement) => void }} options
 * @returns {{ close: () => void, dialog: HTMLDialogElement }}
 */
export function openModal({ title, body, submitLabel, danger, wide, onSubmit, onOpen }) {
  const dialog = createElement('dialog', `modal${wide ? ' modal--wide' : ''}`);
  dialog.setAttribute('aria-labelledby', 'modal-title');

  render(
    dialog,
    html`
      <form class="modal__form" method="dialog" novalidate>
        <header class="modal__header">
          <h2 class="modal__title" id="modal-title">${title}</h2>
          <button class="button button--ghost button--icon" type="button" data-close aria-label="${copy.common.close}">${icons.close}</button>
        </header>
        <div class="modal__body">
          <p class="form-message form-message--error" data-form-error hidden></p>
          ${body}
        </div>
        ${onSubmit
          ? html`<footer class="modal__footer">
              <button class="button" type="button" data-close>${copy.common.cancel}</button>
              <button class="button ${danger ? 'button--danger' : 'button--primary'}" type="submit" data-submit>
                ${submitLabel ?? copy.common.save}
              </button>
            </footer>`
          : ''}
      </form>
    `,
  );

  const form = dialog.querySelector('form');
  const errorBox = dialog.querySelector('[data-form-error]');
  const close = () => dialog.close();

  dialog.addEventListener('close', () => dialog.remove());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close(); // click on the backdrop
    if (event.target instanceof Element && event.target.closest('[data-close]')) close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!onSubmit) return close();
    clearFieldErrors(form);
    errorBox.hidden = true;
    if (!form.checkValidity()) return form.reportValidity();
    try {
      await withLoading(dialog.querySelector('[data-submit]'), () => onSubmit(readForm(form), form));
      close();
    } catch (error) {
      if (!showApiFieldErrors(form, error.details)) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    }
  });

  document.body.append(dialog);
  dialog.showModal();
  onOpen?.(dialog);
  dialog.querySelector('input:not([type=hidden]), select, textarea')?.focus();
  return { close, dialog };
}

/** A yes/no question. Resolves true when confirmed. */
export function confirmDialog({ title, text, confirmLabel, danger = true }) {
  return new Promise((resolve) => {
    let confirmed = false;
    const { dialog } = openModal({
      title,
      body: html`<p>${text}</p>`,
      submitLabel: confirmLabel,
      danger,
      onSubmit: async () => {
        confirmed = true;
      },
    });
    dialog.addEventListener('close', () => resolve(confirmed));
  });
}

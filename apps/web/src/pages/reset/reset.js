// Two steps on one route: ask for a reset email, then (after the email link,
// ?mode=update) choose a new password.
import { PASSWORD_MIN_LENGTH, ROUTES } from '@folio/shared';
import { auth } from '../../core/auth.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, readForm, render } from '../../core/dom.js';
import { withLoading } from '../../components/button/button.js';
import { Field, showFormMessage } from '../../components/field/field.js';

export async function ResetPage({ query }) {
  const updating = query.get('mode') === 'update';
  const el = createElement('section', 'auth-card');
  render(
    el,
    html`
      <header>
        <h1 class="auth-card__title">${updating ? copy.auth.newPasswordTitle : copy.auth.resetTitle}</h1>
        ${updating ? '' : html`<p class="auth-card__lead">${copy.auth.resetLead}</p>`}
      </header>
      <form class="stack" novalidate data-form>
        <p class="form-message" data-message hidden></p>
        ${updating
          ? Field({ label: copy.auth.newPassword, name: 'password', type: 'password', required: true, autocomplete: 'new-password', hint: copy.auth.passwordHint, minlength: PASSWORD_MIN_LENGTH })
          : Field({ label: copy.auth.email, name: 'email', type: 'email', required: true, autocomplete: 'email' })}
        <button class="button button--primary button--block" type="submit">${updating ? copy.auth.updatePassword : copy.auth.sendReset}</button>
      </form>
      <p class="auth-card__footer"><a href="${ROUTES.LOGIN}">${copy.common.back}</a></p>
    `,
  );

  const showMessage = (text, tone) => showFormMessage(el.querySelector('[data-message]'), text, tone);

  const off = on(el, 'submit', '[data-form]', async (event, form) => {
    event.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const values = readForm(form);
    try {
      await withLoading(form.querySelector('[type=submit]'), async () => {
        if (updating) {
          await auth.updatePassword(values.password);
          showMessage(copy.auth.passwordUpdated, 'success');
        } else {
          await auth.sendPasswordReset(values.email);
          showMessage(copy.auth.resetSent, 'success');
        }
      });
    } catch (error) {
      showMessage(error.message || copy.errors.generic, 'error');
    }
  });

  return { el, title: copy.auth.resetTitle, destroy: off };
}

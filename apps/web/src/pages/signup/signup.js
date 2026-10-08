import { PASSWORD_MIN_LENGTH, ROUTES } from '@folio/shared';
import { auth } from '../../core/auth.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, readForm, render } from '../../core/dom.js';
import { nextPath } from '../../core/guards.js';
import { navigate } from '../../core/router.js';
import { withLoading } from '../../components/button/button.js';
import { Field, showFormMessage } from '../../components/field/field.js';
import { loadSession } from '../../state/session.js';

export async function SignupPage({ query }) {
  const el = createElement('section', 'auth-card');
  render(
    el,
    html`
      <header>
        <h1 class="auth-card__title">${copy.auth.signupTitle}</h1>
        <p class="auth-card__lead">${copy.auth.signupLead}</p>
      </header>
      <form class="stack" novalidate data-form>
        <p class="form-message" data-message hidden></p>
        ${Field({ label: copy.auth.fullName, name: 'fullName', required: true, autocomplete: 'name', maxlength: 120 })}
        ${Field({ label: copy.auth.email, name: 'email', type: 'email', required: true, autocomplete: 'email' })}
        ${Field({
          label: copy.auth.password,
          name: 'password',
          type: 'password',
          required: true,
          autocomplete: 'new-password',
          hint: copy.auth.passwordHint,
          minlength: PASSWORD_MIN_LENGTH,
        })}
        <button class="button button--primary button--block" type="submit">${copy.auth.signUp}</button>
      </form>
      <p class="auth-card__footer">${copy.auth.haveAccount} <a href="${ROUTES.LOGIN}">${copy.auth.signIn}</a></p>
    `,
  );

  const showMessage = (text, tone) => showFormMessage(el.querySelector('[data-message]'), text, tone);

  const off = on(el, 'submit', '[data-form]', async (event, form) => {
    event.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const { fullName, email, password } = readForm(form);
    try {
      await withLoading(form.querySelector('[type=submit]'), async () => {
        const { session } = await auth.signUp(email, password, fullName);
        if (!session) return showMessage(copy.auth.confirmEmail, 'success'); // email confirmation is on
        await loadSession();
        navigate(nextPath(query), { replace: true });
      });
    } catch (error) {
      showMessage(error.message || copy.errors.generic, 'error');
    }
  });

  return { el, title: copy.auth.signUp, destroy: off };
}

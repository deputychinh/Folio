import { ROUTES } from '@folio/shared';
import { auth } from '../../core/auth.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, readForm, render } from '../../core/dom.js';
import { nextPath } from '../../core/guards.js';
import { navigate } from '../../core/router.js';
import { withLoading } from '../../components/button/button.js';
import { Field, showFormMessage } from '../../components/field/field.js';
import { loadSession } from '../../state/session.js';

const MODE = { PASSWORD: 'password', LINK: 'link' };

function LoginForm(mode) {
  return html`
    <div class="segmented" role="group" aria-label="${copy.auth.signIn}">
      <button class="segmented__option" type="button" data-mode="${MODE.PASSWORD}" aria-pressed="${mode === MODE.PASSWORD}">${copy.auth.withPassword}</button>
      <button class="segmented__option" type="button" data-mode="${MODE.LINK}" aria-pressed="${mode === MODE.LINK}">${copy.auth.withMagicLink}</button>
    </div>
    <form class="stack" novalidate data-form>
      <p class="form-message form-message--error" data-message hidden></p>
      ${Field({ label: copy.auth.email, name: 'email', type: 'email', required: true, autocomplete: 'email' })}
      ${mode === MODE.PASSWORD
        ? Field({ label: copy.auth.password, name: 'password', type: 'password', required: true, autocomplete: 'current-password' })
        : ''}
      <button class="button button--primary button--block" type="submit">
        ${mode === MODE.PASSWORD ? copy.auth.signIn : copy.auth.sendMagicLink}
      </button>
      ${mode === MODE.PASSWORD ? html`<a href="${ROUTES.RESET}">${copy.auth.forgot}</a>` : ''}
    </form>
  `;
}

export async function LoginPage({ query }) {
  const el = createElement('section', 'auth-card');
  let mode = MODE.PASSWORD;

  render(
    el,
    html`
      <header>
        <h1 class="auth-card__title">${copy.auth.loginTitle}</h1>
        <p class="auth-card__lead">${copy.auth.loginLead}</p>
      </header>
      <div class="stack" data-body></div>
      <p class="auth-card__footer">${copy.auth.noAccount} <a href="${ROUTES.SIGNUP}">${copy.auth.signUp}</a></p>
      <p class="auth-card__hint">${copy.auth.demoHint}</p>
    `,
  );
  const body = el.querySelector('[data-body]');
  const draw = () => render(body, LoginForm(mode));
  draw();

  const showMessage = (text, tone) => showFormMessage(body.querySelector('[data-message]'), text, tone);

  const offs = [
    on(el, 'click', '[data-mode]', (_, button) => {
      mode = button.dataset.mode;
      draw();
    }),
    on(el, 'submit', '[data-form]', async (event, form) => {
      event.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      const { email, password } = readForm(form);
      try {
        await withLoading(form.querySelector('[type=submit]'), async () => {
          if (mode === MODE.LINK) {
            await auth.sendMagicLink(email);
            showMessage(copy.auth.magicLinkSent, 'success');
            return;
          }
          await auth.signIn(email, password);
          await loadSession();
          navigate(nextPath(query), { replace: true });
        });
      } catch (error) {
        showMessage(error.message || copy.errors.generic, 'error');
      }
    }),
  ];

  return { el, title: copy.auth.signIn, destroy: () => offs.forEach((off) => off()) };
}

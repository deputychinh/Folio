import { Currency, enumValues, NAME_MAX, ROUTES, TAX_PERCENT_MAX } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { createElement, html, on, readForm, render } from '../../core/dom.js';
import { navigate } from '../../core/router.js';
import { withLoading } from '../../components/button/button.js';
import { Field, SelectField, showApiFieldErrors, showFormMessage } from '../../components/field/field.js';
import { loadSession, selectWorkspace } from '../../state/session.js';

export async function OnboardingPage() {
  const el = createElement('section', 'auth-card');
  render(
    el,
    html`
      <header>
        <h1 class="auth-card__title">${copy.onboarding.title}</h1>
        <p class="auth-card__lead">${copy.onboarding.lead}</p>
      </header>
      <form class="stack" novalidate data-form>
        <p class="form-message" data-message hidden></p>
        ${Field({ label: copy.onboarding.name, name: 'name', required: true, maxlength: NAME_MAX, autocomplete: 'organization' })}
        <div class="field-grid">
          ${SelectField({
            label: copy.onboarding.currency,
            name: 'currency',
            value: Currency.USD,
            options: enumValues(Currency).map((value) => ({ value, label: copy.currency[value] })),
          })}
          ${Field({ label: copy.onboarding.tax, name: 'taxPercent', type: 'number', value: 0, min: 0, max: TAX_PERCENT_MAX, step: 0.01, inputmode: 'decimal' })}
        </div>
        <button class="button button--primary button--block" type="submit">${copy.onboarding.submit}</button>
      </form>
    `,
  );

  const off = on(el, 'submit', '[data-form]', async (event, form) => {
    event.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const values = readForm(form);
    try {
      await withLoading(form.querySelector('[type=submit]'), async () => {
        const { data } = await api.post('/workspaces', { ...values, taxPercent: Number(values.taxPercent) });
        await loadSession();
        selectWorkspace(data.id);
        navigate(ROUTES.DASHBOARD, { replace: true });
      });
    } catch (error) {
      if (!showApiFieldErrors(form, error.details)) showFormMessage(el.querySelector('[data-message]'), error.message);
    }
  });

  return { el, title: copy.onboarding.title, destroy: off };
}

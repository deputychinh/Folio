import { Currency, enumValues, isManager, NAME_MAX, TAX_PERCENT_MAX } from '@folio/shared';
import { api } from '../../core/api.js';
import { copy } from '../../core/copy.js';
import { html, on, readForm, render } from '../../core/dom.js';
import { withLoading } from '../../components/button/button.js';
import { ErrorState } from '../../components/empty-state/empty-state.js';
import { clearFieldErrors, Field, SelectField, showApiFieldErrors } from '../../components/field/field.js';
import { currentWorkspace, loadSession } from '../../state/session.js';
import { showToast } from '../../state/toast.js';
import { forgetWorkspace, loadWorkspace } from '../../state/workspace.js';

const DEFAULT_ACCENT = '#b4561f'; // the brand ochre, shown when a workspace has no accent yet

function WorkspaceForm(workspace, canEdit) {
  const s = copy.settings;
  return html`
    <form class="card" novalidate data-workspace-form>
      <div class="card__body stack">
        <p class="settings__lead">${s.workspaceLead}</p>
        ${canEdit ? '' : html`<p class="form-message">${s.readOnly}</p>`}
        ${Field({ label: s.name, name: 'name', required: true, value: workspace.name, maxlength: NAME_MAX, disabled: !canEdit })}
        <div class="field-grid">
          ${SelectField({
            label: s.currency,
            name: 'currency',
            value: workspace.currency,
            hint: s.currencyHint,
            disabled: !canEdit,
            options: enumValues(Currency).map((value) => ({ value, label: copy.currency[value] })),
          })}
          ${Field({ label: s.tax, name: 'taxPercent', type: 'number', value: workspace.taxPercent, min: 0, max: TAX_PERCENT_MAX, step: 0.01, disabled: !canEdit })}
          ${Field({ label: s.accent, name: 'brandAccent', type: 'color', value: workspace.brandAccent ?? DEFAULT_ACCENT, disabled: !canEdit })}
        </div>
      </div>
      ${canEdit ? html`<footer class="card__footer"><button class="button button--primary" type="submit">${copy.common.save}</button></footer>` : ''}
    </form>
  `;
}

export async function mountWorkspaceTab(container) {
  let workspace;
  try {
    workspace = await loadWorkspace();
  } catch (error) {
    render(container, ErrorState(error));
    return () => {};
  }
  const canEdit = isManager(currentWorkspace()?.role);
  render(container, WorkspaceForm(workspace, canEdit));

  return on(container, 'submit', '[data-workspace-form]', async (event, form) => {
    event.preventDefault();
    clearFieldErrors(form);
    if (!form.checkValidity()) return form.reportValidity();
    const values = readForm(form);
    try {
      await withLoading(form.querySelector('[type=submit]'), async () => {
        await api.patch('/workspaces/current', { ...values, taxPercent: Number(values.taxPercent) });
        forgetWorkspace();
        await loadSession(); // the name shows in the sidebar
        showToast(copy.settings.savedToast);
      });
    } catch (error) {
      if (!showApiFieldErrors(form, error.details)) showToast(error.message, 'error');
    }
  });
}

// Labelled form controls. Each field links its hint and error to the input
// through aria-describedby, so screen readers read them with the label.
import { copy } from '../../core/copy.js';
import { html } from '../../core/dom.js';

let counter = 0;
const nextId = (name) => `field-${name}-${++counter}`;

/** @param {{ id: string, label: string, hint?: string, optional?: boolean, wide?: boolean }} props */
function wrapper({ id, label, hint, optional, wide }, control) {
  return html`
    <div class="field${wide ? ' field--wide' : ''}" data-field>
      <label class="field__label" for="${id}">
        ${label}${optional ? html` <span class="field__optional">(${copy.common.optional})</span>` : ''}
      </label>
      ${control}
      ${hint ? html`<p class="field__hint" id="${id}-hint">${hint}</p>` : ''}
      <p class="field__error" id="${id}-error" data-error hidden></p>
    </div>
  `;
}

function describedBy(id, hint) {
  return hint ? `${id}-hint ${id}-error` : `${id}-error`;
}

/**
 * @param {{ label: string, name: string, type?: string, value?: string | number, required?: boolean,
 *   optional?: boolean, hint?: string, placeholder?: string, autocomplete?: string, min?: string | number,
 *   max?: string | number, step?: string | number, inputmode?: string, minlength?: number, maxlength?: number, wide?: boolean,
 *   disabled?: boolean }} props
 */
export function Field(props) {
  const id = nextId(props.name);
  const control = html`<input
    class="field__control"
    id="${id}"
    name="${props.name}"
    type="${props.type ?? 'text'}"
    value="${props.value ?? ''}"
    ${props.required ? html`required` : ''}
    ${props.disabled ? html`disabled` : ''}
    ${props.placeholder ? html`placeholder="${props.placeholder}"` : ''}
    ${props.autocomplete ? html`autocomplete="${props.autocomplete}"` : ''}
    ${props.inputmode ? html`inputmode="${props.inputmode}"` : ''}
    ${props.min !== undefined ? html`min="${props.min}"` : ''}
    ${props.max !== undefined ? html`max="${props.max}"` : ''}
    ${props.step !== undefined ? html`step="${props.step}"` : ''}
    ${props.minlength ? html`minlength="${props.minlength}"` : ''}
    ${props.maxlength ? html`maxlength="${props.maxlength}"` : ''}
    aria-describedby="${describedBy(id, props.hint)}"
  />`;
  return wrapper({ ...props, id }, control);
}

/** @param {{ label: string, name: string, value?: string, rows?: number, hint?: string, optional?: boolean, maxlength?: number, wide?: boolean, disabled?: boolean }} props */
export function TextareaField(props) {
  const id = nextId(props.name);
  const control = html`<textarea
    class="field__control field__control--textarea"
    id="${id}"
    name="${props.name}"
    rows="${props.rows ?? 4}"
    ${props.maxlength ? html`maxlength="${props.maxlength}"` : ''}
    ${props.disabled ? html`disabled` : ''}
    aria-describedby="${describedBy(id, props.hint)}"
  >${props.value ?? ''}</textarea>`;
  return wrapper({ ...props, id }, control);
}

/**
 * @param {{ label: string, name: string, options: { value: string, label: string }[], value?: string,
 *   required?: boolean, placeholder?: string, hint?: string, wide?: boolean, disabled?: boolean }} props
 */
export function SelectField(props) {
  const id = nextId(props.name);
  const control = html`<select
    class="field__control field__control--select"
    id="${id}"
    name="${props.name}"
    ${props.required ? html`required` : ''}
    ${props.disabled ? html`disabled` : ''}
    aria-describedby="${describedBy(id, props.hint)}"
  >
    ${props.placeholder ? html`<option value="">${props.placeholder}</option>` : ''}
    ${props.options.map(
      (option) => html`<option value="${option.value}" ${option.value === props.value ? html`selected` : ''}>${option.label}</option>`,
    )}
  </select>`;
  return wrapper({ ...props, id }, control);
}

/** Show an error under the field with that name (or clear it with an empty message). */
export function setFieldError(form, name, message) {
  const control = form.elements.namedItem(name);
  const field = control?.closest?.('[data-field]');
  if (!field) return;
  const error = field.querySelector('[data-error]');
  error.textContent = message ?? '';
  error.hidden = !message;
  field.classList.toggle('field--invalid', Boolean(message));
  control.setAttribute('aria-invalid', message ? 'true' : 'false');
}

export function clearFieldErrors(form) {
  form.querySelectorAll('[data-field]').forEach((field) => {
    field.classList.remove('field--invalid');
    const error = field.querySelector('[data-error]');
    error.hidden = true;
    error.textContent = '';
  });
  form.querySelectorAll('[aria-invalid]').forEach((control) => control.setAttribute('aria-invalid', 'false'));
}

/**
 * Show API validation details under their fields when we can match them
 * (class-validator messages start with the property name).
 * @returns {boolean} true if at least one field was matched
 */
export function showApiFieldErrors(form, details) {
  if (!Array.isArray(details)) return false;
  let matched = false;
  for (const message of details) {
    const name = String(message).split(' ')[0];
    if (form.elements.namedItem(name)) {
      setFieldError(form, name, message);
      matched = true;
    }
  }
  return matched;
}

/** Show a message in a .form-message element. tone: 'error' | 'success'. */
export function showFormMessage(element, text, tone = 'error') {
  element.textContent = text;
  element.className = `form-message form-message--${tone}`;
  element.hidden = false;
}

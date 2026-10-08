// Safe HTML templates without a framework.
// Every value placed in html`...` is escaped unless it is itself an html`...`
// result, so user data can never become markup (DS-07).
// Keep attribute values quoted: <a title="${value}">.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

class SafeHtml {
  /** @param {string} value */
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function toHtml(value) {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  return escapeHtml(value);
}

/**
 * @param {TemplateStringsArray} strings
 * @param {...unknown} values
 * @returns {SafeHtml}
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i += 1) out += toHtml(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

/** Replace the content of an element. Only accepts html`` results. */
export function render(element, template) {
  if (!(template instanceof SafeHtml)) throw new TypeError('render() expects an html`` template');
  element.innerHTML = template.value;
}

/** Append an html`` template at the end of an element. */
export function append(element, template) {
  if (!(template instanceof SafeHtml)) throw new TypeError('append() expects an html`` template');
  element.insertAdjacentHTML('beforeend', template.value);
}

/** A new element with a class and optional content. */
export function createElement(tag, className, template) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (template) render(element, template);
  return element;
}

/**
 * Delegated event listener: one listener on `root`, matched by selector.
 * @returns {() => void} call it to remove the listener
 */
export function on(root, type, selector, handler) {
  const listener = (event) => {
    const target = event.target instanceof Element ? event.target.closest(selector) : null;
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, listener);
  return () => root.removeEventListener(type, listener);
}

/** Read a form into a plain object of trimmed strings. */
export function readForm(form) {
  const values = {};
  for (const [key, value] of new FormData(form)) values[key] = typeof value === 'string' ? value.trim() : value;
  return values;
}

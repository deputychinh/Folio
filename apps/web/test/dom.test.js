import { describe, expect, it } from 'vitest';
import { append, escapeHtml, html, readForm, render } from '../src/core/dom.js';

describe('html templates', () => {
  it('escapes interpolated values, so user data never becomes markup', () => {
    const name = '<img src=x onerror="alert(1)">';
    const host = document.createElement('div');
    render(host, html`<p class="customer">${name}</p>`);

    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toBe(name);
  });

  it('escapes quotes, so values cannot break out of an attribute', () => {
    const host = document.createElement('div');
    render(host, html`<a title="${'" onmouseover="alert(1)'}">x</a>`);
    const anchor = host.querySelector('a');
    expect(anchor.getAttribute('onmouseover')).toBeNull();
    expect(anchor.title).toBe('" onmouseover="alert(1)');
  });

  it('keeps nested templates and joins arrays', () => {
    const items = ['a', '<b>'];
    expect(html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`.toString()).toBe('<ul><li>a</li><li>&lt;b&gt;</li></ul>');
  });

  it('drops null, undefined and false', () => {
    expect(html`${null}${undefined}${false}${0}`.toString()).toBe('0');
  });

  it('refuses plain strings in render() and append()', () => {
    const host = document.createElement('div');
    expect(() => render(host, '<b>raw</b>')).toThrow(TypeError);
    expect(() => append(host, '<b>raw</b>')).toThrow(TypeError);
  });

  it('escapeHtml covers the five special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('readForm', () => {
  it('returns trimmed values by name', () => {
    const form = document.createElement('form');
    render(form, html`<input name="email" value="  a@b.co " /><select name="role"><option value="admin" selected>Admin</option></select>`);
    expect(readForm(form)).toEqual({ email: 'a@b.co', role: 'admin' });
  });
});

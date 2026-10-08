// Layout for sign-in pages: a brand panel beside the form.
import { copy } from '../../core/copy.js';
import { createElement, html, render } from '../../core/dom.js';
import { BrandMark } from '../app-shell/app-shell.js';

/** @type {import('../../core/router.js').Layout} */
export const AuthLayout = {
  mount(root) {
    const layout = createElement('div', 'auth-layout');
    render(
      layout,
      html`
        <aside class="auth-layout__aside">
          <div class="auth-layout__brand">${BrandMark()}</div>
          <figure class="auth-layout__quote">
            <blockquote class="auth-layout__text">${copy.auth.asideQuote}</blockquote>
            <figcaption class="auth-layout__author">${copy.auth.asideAuthor}</figcaption>
          </figure>
          <p class="auth-layout__tagline">${copy.brand.tagline}</p>
        </aside>
        <main class="auth-layout__main" id="main-content"></main>
      `,
    );
    root.append(layout);
    return layout.querySelector('.auth-layout__main');
  },
};

// History-API router. Each route has a pattern from ROUTES (shared), an
// optional layout, guards, and a page loader. A page is an async function
// that returns { el, title, destroy? }.

/**
 * @typedef {{ params: Record<string, string>, query: URLSearchParams, path: string }} RouteContext
 * @typedef {{ el: HTMLElement, title: string, destroy?: () => void }} Page
 * @typedef {(ctx: RouteContext) => Promise<string | null> | string | null} Guard  returns a redirect path or null
 * @typedef {{ pattern: string, page: (ctx: RouteContext) => Promise<Page>, guards?: Guard[], layout?: Layout }} Route
 * @typedef {{ mount: (root: HTMLElement) => HTMLElement, update?: (ctx: RouteContext) => void, unmount?: () => void }} Layout
 */

const APP_NAME = 'Folio';

/** @type {(Route & { regex: RegExp, keys: string[] })[]} */
let routes = [];
/** @type {Route | null} */
let fallback = null;
let root = null;
let currentPage = null;
let currentLayout = null;
let outlet = null;
let renderId = 0;

function compile(pattern) {
  const keys = [];
  const source = pattern.replace(/:([a-zA-Z]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${source}/?$`), keys };
}

function match(path) {
  for (const route of routes) {
    const found = route.regex.exec(path);
    if (found) {
      const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(found[i + 1])]));
      return { route, params };
    }
  }
  return { route: fallback, params: {} };
}

/** Navigate within the app. */
export function navigate(to, { replace = false } = {}) {
  if (replace) history.replaceState(null, '', to);
  else history.pushState(null, '', to);
  void renderCurrent();
}

/** Change some query values of the current URL and re-render (used by list filters). */
export function setQuery(patch) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  navigate(url.pathname + url.search, { replace: true });
}

/** Re-render the current route, e.g. after the workspace changes. */
export function reload() {
  void renderCurrent();
}

async function renderCurrent() {
  const id = ++renderId;
  const path = window.location.pathname;
  const { route, params } = match(path);
  const ctx = { params, query: new URLSearchParams(window.location.search), path };

  for (const guard of route.guards ?? []) {
    const redirectTo = await guard(ctx);
    if (id !== renderId) return;
    if (redirectTo && redirectTo !== path) return navigate(redirectTo, { replace: true });
  }

  const page = await route.page(ctx);
  if (id !== renderId) return page.destroy?.(); // a newer navigation won

  currentPage?.destroy?.();
  if (currentLayout !== (route.layout ?? null)) {
    currentLayout?.unmount?.();
    root.replaceChildren();
    currentLayout = route.layout ?? null;
    outlet = currentLayout ? currentLayout.mount(root) : root;
  }
  currentLayout?.update?.(ctx);
  outlet.replaceChildren(page.el);
  currentPage = page;

  document.title = page.title ? `${page.title} · ${APP_NAME}` : APP_NAME;
  window.scrollTo(0, 0);
  // Move focus to the new page heading so screen readers announce the change.
  const heading = page.el.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

/** @param {MouseEvent} event @param {Element | null} anchor @returns {anchor is HTMLAnchorElement} */
function isInternalLink(event, anchor) {
  return (
    anchor instanceof HTMLAnchorElement &&
    anchor.origin === window.location.origin &&
    !anchor.hasAttribute('download') &&
    anchor.target !== '_blank' &&
    !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0
  );
}

/**
 * @param {HTMLElement} rootElement
 * @param {Route[]} routeList
 * @param {Route} notFound
 */
export function startRouter(rootElement, routeList, notFound) {
  root = rootElement;
  outlet = rootElement; // pages without a layout render straight into the root
  routes = routeList.map((route) => ({ ...route, ...compile(route.pattern) }));
  fallback = notFound;

  document.addEventListener('click', (event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!isInternalLink(event, anchor)) return;
    event.preventDefault();
    navigate(anchor.pathname + anchor.search);
  });
  window.addEventListener('popstate', () => void renderCurrent());
  return renderCurrent();
}

/** Fill a ROUTES pattern: buildPath('/quotes/:id', { id }) → '/quotes/123'. */
export function buildPath(pattern, params = {}) {
  return pattern.replace(/:([a-zA-Z]+)/g, (_, key) => encodeURIComponent(params[key]));
}

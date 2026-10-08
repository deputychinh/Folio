# ADR-0001: A vanilla JavaScript single-page app

**Status:** accepted · 2026-10-08

## Context
The brief asks for a polished B2B SPA in vanilla JavaScript and custom CSS, with no frameworks. We still want the things a framework normally gives: routing, safe templating, state, and a repeatable page structure.

## Decision
Write the few pieces we need by hand, each small enough to read in one sitting:

- `core/dom.js`: an `html` tagged template that escapes every value, plus `render()`, `append()` and delegated `on()`.
- `core/router.js`: History API routes with params, guards and layouts. A page is an async function that returns `{ el, title, destroy }`.
- `core/store.js`: `createStore()` with get, set and subscribe.
- `core/api.js`: one fetch wrapper for the `{ data, meta }` / `{ error }` envelope.

Vite is used only as the dev server and bundler (no framework plugin). The browser bundles `@supabase/auth-js` and nothing else from Supabase.

## Consequences
- 46 KB of gzipped JS on first load, under the 60 KB budget. CI checks the budget.
- XSS safety comes from the template function, not from developer care. ESLint blocks `innerHTML` and `insertAdjacentHTML` outside `dom.js`, and unit tests cover the escaping.
- More code is ours to maintain. To keep it small, every page and component follows the same single pattern.

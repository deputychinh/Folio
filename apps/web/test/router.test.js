import { describe, expect, it } from 'vitest';
import { buildPath } from '../src/core/router.js';
import { createStore } from '../src/core/store.js';
import { readQuery } from '../src/utils/list-query.js';
import { formatRelativeTime } from '../src/utils/relative-time.js';

describe('buildPath', () => {
  it('fills and encodes params', () => {
    expect(buildPath('/quotes/:id', { id: 'a b/c' })).toBe('/quotes/a%20b%2Fc');
  });
});

describe('createStore', () => {
  it('merges patches and notifies until unsubscribed', () => {
    const store = createStore({ a: 1, b: 2 });
    const seen = [];
    const off = store.subscribe((state) => seen.push(state.a));
    store.set({ a: 3 });
    off();
    store.set({ a: 4 });
    expect(store.get()).toEqual({ a: 4, b: 2 });
    expect(seen).toEqual([3]);
  });
});

describe('readQuery', () => {
  it('keeps only known, non-empty keys and makes page a number', () => {
    const query = new URLSearchParams('status=sent&page=2&search=&other=x');
    expect(readQuery(query, ['status', 'page', 'search'])).toEqual({ status: 'sent', page: 2 });
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');
  it.each([
    ['2026-10-08T11:59:30Z', 'this minute'],
    ['2026-10-08T09:00:00Z', '3 hours ago'],
    ['2026-10-07T12:00:00Z', 'yesterday'],
    ['2026-10-10T12:00:00Z', 'in 2 days'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

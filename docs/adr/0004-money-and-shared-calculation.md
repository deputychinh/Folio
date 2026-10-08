# ADR-0004: Money as integer minor units, one shared calculation

**Status:** accepted · 2026-10-08

## Context
Floating-point money creates cent errors. Quote totals are shown in three places (editor preview, sent quote, client page), and they must always match what the client accepts.

## Decision
- Every amount is an integer number of minor units (`bigint` in Postgres). VND has 0 decimals; the other currencies have 2.
- `calcQuoteTotals()` in `packages/shared/src/money.ts` is the only implementation. It uses BigInt multiplication and rounds half-up once per step: line → discount → tax.
- The editor uses it for the live preview. The API recomputes with the same function before saving and never trusts totals sent by the browser.

## Consequences
- The preview and the stored totals are always the same number.
- The SQL seed computes its totals separately, so a contract test (`seed.contract.spec.ts`) checks them against the shared function.

# ADR-0002: NestJS as one Vercel serverless function

**Status:** accepted · 2026-10-08

## Context
The brief asks for Node.js serverless functions on Vercel, and we chose NestJS for structure (modules, DI, guards, pipes). Nest expects a long-running server.

## Decision
`api/index.js` is the only function. `apps/api/src/serverless.ts` creates the Nest app once per function instance, caches the Express handler in a module variable, and reuses it for later invocations. Every `/api/*` request is rewritten to that function. The function runs in the same region as Supabase.

Alternatives considered:
- One Vercel function per route, with no framework. Faster cold starts, but guards, validation and errors would have to be duplicated in each function.
- A separate always-on API host. Cheaper per request at scale, but it goes against the brief.

## Consequences
- Locally, the cold-start init of the Nest app takes about 45 ms; real cold starts on Vercel also include module loading. Each cold start is logged with `coldStart: true` so it can be measured in production.
- If cold starts ever matter, the public quote routes can move into plain functions without touching the rest of the app.

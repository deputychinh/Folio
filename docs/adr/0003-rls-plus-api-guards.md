# ADR-0003: Defence in depth, API guards plus Postgres RLS

**Status:** accepted · 2026-10-08

## Context
Each workspace's data must never leak to another workspace. A single missing `where workspace_id = …` in the API would be a data breach.

## Decision
- The API verifies the JWT (`AuthGuard`, JWKS) and checks membership and role (`WorkspaceGuard` + `@Roles`).
- The API then calls Supabase **as the user**, so Row Level Security (`is_member()`) filters every query a second time.
- Writes that must follow a rule (quote status, the last owner, invites) happen only inside `security definer` Postgres functions. These tables have no write policies.
- The service-role key is used by one module only (public quotes), and only for three functions that check the token hash themselves.

## Consequences
- A bug in a repository query cannot return another workspace's rows. Integration tests prove this (`security.spec.ts`).
- The rules live in both TypeScript and SQL, so error messages stay clear (`INVALID_TRANSITION`) and the database stays correct even if the API is wrong.

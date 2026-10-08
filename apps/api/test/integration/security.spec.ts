// Workspace isolation (RLS + guard), roles, last-owner rule, rate limit.
import { Currency, ErrorCode, PUBLIC_RATE_LIMIT, WorkspaceRole } from '@folio/shared';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { anonymous, as, newUser, startApp } from './setup';

let app: NestExpressApplication;
beforeAll(async () => (app = await startApp()));
afterAll(async () => app.close());

async function workspaceFor(name: string) {
  const user = await newUser(name);
  const res = await as(app, user.token).post('/workspaces', { name: `${name} Inc`, currency: Currency.USD, taxPercent: 0 }).expect(201);
  return { user, workspaceId: res.body.data.id as string };
}

describe('workspace isolation', () => {
  it('a user cannot read another workspace, even by id', async () => {
    const a = await workspaceFor('Alice');
    const b = await workspaceFor('Bob');
    const customer = await as(app, a.user.token, a.workspaceId).post('/customers', { companyName: 'Secret Client' }).expect(201);

    // Bob asks for Alice's workspace → guard says no.
    await as(app, b.user.token, a.workspaceId).get('/customers').expect(403);
    // Bob asks for Alice's customer inside his own workspace → RLS hides it.
    await as(app, b.user.token, b.workspaceId).get(`/customers/${customer.body.data.id}`).expect(404);
    const list = await as(app, b.user.token, b.workspaceId).get('/customers?search=Secret').expect(200);
    expect(list.body.data).toEqual([]);
  });

  it('rejects requests without a valid token', async () => {
    const res = await as(app, 'not-a-jwt').get('/me').expect(401);
    expect(res.body.error).toMatchObject({ code: ErrorCode.UNAUTHORIZED, requestId: expect.any(String) });
  });
});

describe('team rules', () => {
  it('invite → accept → member cannot manage the team; last owner is protected', async () => {
    const { user: owner, workspaceId } = await workspaceFor('Owen');
    const member = await newUser('Mia Member');

    const invite = await as(app, owner.token, workspaceId).post('/members/invites', { email: member.email, role: WorkspaceRole.MEMBER }).expect(201);
    const token = invite.body.data.inviteUrl.split('/invite/')[1];

    // Someone else cannot use the invite.
    const stranger = await newUser('Sam Stranger');
    await as(app, stranger.token).post(`/invites/${token}/accept`).expect(403);

    await as(app, member.token).post(`/invites/${token}/accept`).expect(200);
    const team = await as(app, owner.token, workspaceId).get('/members').expect(200);
    expect(team.body.data).toHaveLength(2);

    // A member cannot invite or change roles.
    await as(app, member.token, workspaceId).post('/members/invites', { email: 'x@folio.test', role: WorkspaceRole.MEMBER }).expect(403);
    await as(app, member.token, workspaceId).patch(`/members/${owner.id}`, { role: WorkspaceRole.MEMBER }).expect(403);

    // The only owner cannot demote themselves.
    const demote = await as(app, owner.token, workspaceId).patch(`/members/${owner.id}`, { role: WorkspaceRole.MEMBER }).expect(409);
    expect(demote.body.error.code).toBe(ErrorCode.CONFLICT);

    // An invite cannot create an owner.
    await as(app, owner.token, workspaceId).post('/members/invites', { email: 'boss@folio.test', role: WorkspaceRole.OWNER }).expect(422);
  });
});

describe('public rate limit', () => {
  it(`allows ${PUBLIC_RATE_LIMIT.requests} calls per window, then 429 with Retry-After`, async () => {
    const client = anonymous(app, `203.0.113.${Math.floor(Math.random() * 250)}`);
    for (let i = 0; i < PUBLIC_RATE_LIMIT.requests; i += 1) {
      await client.get('/public/quotes/unknown-token-1234').expect(404);
    }
    const blocked = await client.get('/public/quotes/unknown-token-1234').expect(429);
    expect(blocked.headers['retry-after']).toBe(String(PUBLIC_RATE_LIMIT.windowSeconds));
  });
});

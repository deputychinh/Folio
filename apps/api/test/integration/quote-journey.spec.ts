// Business flows B1, B3, B4, B5 from docs/plan.md §9 against local Supabase.
import { addDays, calcQuoteTotals, CatalogUnit, Currency, DiscountType, ErrorCode, QuoteStatus, toIsoDate } from '@folio/shared';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { anonymous, as, newUser, startApp } from './setup';

let app: NestExpressApplication;
beforeAll(async () => (app = await startApp()));
afterAll(async () => app.close());

describe('quote journey', () => {
  let owner: Awaited<ReturnType<typeof newUser>>;
  let workspaceId: string;
  let customerId: string;
  let quoteId: string;
  let shareToken: string;

  const today = toIsoDate(new Date());
  const items = [
    { name: 'Discovery', unit: CatalogUnit.PROJECT, quantity: 1, unitPriceMinor: 150000 },
    { name: 'Design', unit: CatalogUnit.DAY, quantity: 2.5, unitPriceMinor: 80000 },
  ];

  it('B1: a new user has no workspace, then creates one and becomes owner', async () => {
    owner = await newUser('Olivia Owner');
    const me = await as(app, owner.token).get('/me').expect(200);
    expect(me.body.data.workspaces).toEqual([]);

    const created = await as(app, owner.token)
      .post('/workspaces', { name: 'Journey Co', currency: Currency.EUR, taxPercent: 20 })
      .expect(201);
    workspaceId = created.body.data.id;

    const after = await as(app, owner.token).get('/me').expect(200);
    expect(after.body.data.workspaces).toEqual([{ id: workspaceId, name: 'Journey Co', role: 'owner' }]);
  });

  it('creates a customer', async () => {
    const res = await as(app, owner.token, workspaceId)
      .post('/customers', { companyName: 'Client Ltd', contactName: 'Cara Client', email: 'cara@client.test' })
      .expect(201);
    customerId = res.body.data.id;
  });

  it('B3: saves a draft; totals come from the server', async () => {
    const res = await as(app, owner.token, workspaceId)
      .post('/quotes', {
        customerId,
        title: 'New website',
        validUntil: addDays(today, 14),
        items,
        discountType: DiscountType.PERCENT,
        discountValue: 10,
        taxPercent: 20,
        notes: 'Thanks!',
      })
      .expect(201);
    const quote = res.body.data;
    quoteId = quote.id;

    const expected = calcQuoteTotals(items, { type: DiscountType.PERCENT, value: 10 }, 20);
    expect(quote).toMatchObject({ status: QuoteStatus.DRAFT, currency: Currency.EUR, ...expected });
    expect(quote.number).toMatch(/^Q-\d{4}-0001$/);
    expect(quote.items).toHaveLength(2);
  });

  it('B3: editing a draft replaces its items', async () => {
    const res = await as(app, owner.token, workspaceId)
      .put(`/quotes/${quoteId}`, {
        customerId,
        title: 'New website (v2)',
        validUntil: addDays(today, 14),
        items: [items[0]],
        discountType: DiscountType.AMOUNT,
        discountValue: 0,
        taxPercent: 0,
      })
      .expect(200);
    expect(res.body.data).toMatchObject({ title: 'New website (v2)', totalMinor: 150000 });
    expect(res.body.data.items).toHaveLength(1);
  });

  it('B4: sending returns a share link once and moves the quote to SENT', async () => {
    const res = await as(app, owner.token, workspaceId).post(`/quotes/${quoteId}/send`).expect(200);
    expect(res.body.data.quote.status).toBe(QuoteStatus.SENT);
    shareToken = res.body.data.shareUrl.split('/q/')[1];
    expect(shareToken).toHaveLength(43);
  });

  it('a sent quote cannot be edited (409 INVALID_TRANSITION)', async () => {
    const res = await as(app, owner.token, workspaceId)
      .put(`/quotes/${quoteId}`, {
        customerId, title: 'x', validUntil: addDays(today, 14), items, discountType: DiscountType.AMOUNT, discountValue: 0, taxPercent: 0,
      })
      .expect(409);
    expect(res.body.error.code).toBe(ErrorCode.INVALID_TRANSITION);
  });

  it('B5: the client opens the link without an account; the first open marks VIEWED', async () => {
    const res = await anonymous(app).get(`/public/quotes/${shareToken}`).expect(200);
    expect(res.body.data).toMatchObject({ title: 'New website (v2)', status: QuoteStatus.VIEWED, seller: { name: 'Journey Co' } });
    expect(res.body.data).not.toHaveProperty('id');
    expect(JSON.stringify(res.body.data)).not.toContain(owner.email);
  });

  it('B5: the client accepts; a second answer is refused', async () => {
    const accepted = await anonymous(app).post(`/public/quotes/${shareToken}/respond`, { accept: true, clientName: 'Cara Client' }).expect(200);
    expect(accepted.body.data).toMatchObject({ status: QuoteStatus.ACCEPTED, clientName: 'Cara Client' });

    const again = await anonymous(app).post(`/public/quotes/${shareToken}/respond`, { accept: false, clientName: 'Cara' }).expect(409);
    expect(again.body.error.code).toBe(ErrorCode.INVALID_TRANSITION);
  });

  it('the activity log shows every step', async () => {
    const res = await as(app, owner.token, workspaceId).get(`/quotes/${quoteId}/events`).expect(200);
    expect(res.body.data.map((e: { type: string }) => e.type).reverse()).toEqual(['created', 'sent', 'viewed', 'accepted']);
  });

  it('the dashboard counts the win', async () => {
    const res = await as(app, owner.token, workspaceId).get('/dashboard').expect(200);
    expect(res.body.data).toMatchObject({ currency: Currency.EUR, wonValueMinor: 150000, winRatePercent: 100, openCount: 0 });
  });

  it('a wrong or unknown token is a 404', async () => {
    await anonymous(app).get('/public/quotes/not-a-real-token-at-all').expect(404);
    await anonymous(app).get('/public/quotes/%3Cscript%3E').expect(404);
  });

  it('duplicating gives a new draft with a new number', async () => {
    const res = await as(app, owner.token, workspaceId).post(`/quotes/${quoteId}/duplicate`).expect(201);
    expect(res.body.data).toMatchObject({ status: QuoteStatus.DRAFT, number: expect.stringMatching(/-0002$/) });
  });
});

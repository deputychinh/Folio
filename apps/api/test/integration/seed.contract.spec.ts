// The seed computes totals in SQL; they must equal what calcQuoteTotals gives.
import { calcQuoteTotals } from '@folio/shared';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import { as, startApp } from './setup';

const WORKSPACE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let app: NestExpressApplication;
beforeAll(async () => (app = await startApp()));
afterAll(async () => app.close());

it('seeded quote totals match the shared calculation', async () => {
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await anon.auth.signInWithPassword({ email: 'owner@folio.demo', password: 'Demo@1234' });
  const owner = as(app, data.session!.access_token, WORKSPACE);

  const list = await owner.get('/quotes?pageSize=100').expect(200);
  expect(list.body.data.length).toBeGreaterThanOrEqual(12);

  for (const { id } of list.body.data.filter((q: { number: string }) => /-00(0\d|1[0-2])$/.test(q.number))) {
    const quote = (await owner.get(`/quotes/${id}`).expect(200)).body.data;
    const expected = calcQuoteTotals(quote.items, { type: quote.discountType, value: quote.discountValue }, quote.taxPercent);
    expect({ number: quote.number, ...expected }).toEqual({
      number: quote.number,
      subtotalMinor: quote.subtotalMinor,
      discountMinor: quote.discountMinor,
      taxMinor: quote.taxMinor,
      totalMinor: quote.totalMinor,
    });
  }
});

-- Demo data for local development and the sales demo.
-- Accounts: owner@folio.demo / member@folio.demo, password Demo@1234
-- Public demo link: /q/folio-demo-quote (token hashed below, like the API does)
-- Dates are relative to today so the demo always looks current.

-- ---------- Users ----------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'owner@folio.demo', extensions.crypt('Demo@1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ava Bennett"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'member@folio.demo', extensions.crypt('Demo@1234', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Liam Carter"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@folio.demo';

-- ---------- Workspace ----------
insert into public.workspaces (id, name, currency, tax_percent, brand_accent, created_by)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Harbor & Pine Studio', 'USD', 8, '#B4561F',
        '11111111-1111-4111-8111-111111111111');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'member');

-- ---------- Customers ----------
insert into public.customers (id, workspace_id, company_name, contact_name, email, phone, address, created_at)
select ('cccccccc-cccc-4ccc-8ccc-' || lpad(n::text, 12, '0'))::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       company, contact, email, phone, address, now() - make_interval(days => 60 - n * 5)
from (values
  (1, 'Brightwater Logistics', 'Maya Patel', 'maya@brightwater.example', '+1 415 555 0101', '120 Market St, San Francisco'),
  (2, 'Kestrel Health', 'Daniel Okafor', 'daniel@kestrel.example', '+44 20 7946 0102', '18 King''s Rd, London'),
  (3, 'Lumen Retail Group', 'Sofia Rossi', 'sofia@lumen.example', '+39 02 5550 0103', 'Via Torino 5, Milan'),
  (4, 'Orbit Fintech', 'Noah Kim', 'noah@orbit.example', '+65 6555 0104', '1 Raffles Pl, Singapore'),
  (5, 'Greenfield Foods', 'Emma Larsen', 'emma@greenfield.example', '+45 3555 0105', 'Nyhavn 12, Copenhagen'),
  (6, 'Atlas Engineering', 'Lucas Martin', 'lucas@atlas.example', '+33 1 5555 0106', '9 Rue Lafayette, Paris'),
  (7, 'Cobalt Education', 'Chloe Nguyen', 'chloe@cobalt.example', '+61 2 5550 0107', '200 George St, Sydney'),
  (8, 'Summit Legal', 'Ethan Brooks', 'ethan@summit.example', '+1 212 555 0108', '30 Rockefeller Plaza, New York')
) as c(n, company, contact, email, phone, address);

-- ---------- Catalog ----------
insert into public.catalog_items (workspace_id, name, description, unit, unit_price_minor) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Discovery workshop', 'Half-day session with stakeholders', 'project', 180000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Brand identity', 'Logo, palette, typography, guidelines', 'project', 650000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'UX design', 'Wireframes and interactive prototypes', 'day', 85000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Front-end development', 'Accessible, responsive build', 'day', 95000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Back-end development', 'APIs, integrations, data', 'day', 105000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Copywriting', 'Web and campaign copy', 'hour', 12000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Hosting & maintenance', 'Monitoring, updates, backups', 'month', 45000),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Photography', 'On-site shoot, edited selection', 'day', 140000);

-- ---------- Quotes ----------
-- n, customer, title, status, valid_until offset, sent days ago, responded days ago, discount, tax, client
create temporary table seed_quotes as
select * from (values
  (1,  1, 'Logistics dashboard redesign', 'accepted', 20, 25, 18, 'percent', 10.00, 8.00, 'Maya Patel'),
  (2,  2, 'Patient portal UX audit',      'viewed',   12,  3, null, 'amount', 0.00, 8.00, null),
  (3,  3, 'Retail brand refresh',         'sent',     25,  1, null, 'percent', 5.00, 8.00, null),
  (4,  4, 'Onboarding flow prototype',    'declined', 10, 20, 12, 'amount', 0.00, 8.00, 'Noah Kim'),
  (5,  5, 'Product photography — spring', 'accepted', 15, 14,  9, 'amount', 20000.00, 8.00, 'Emma Larsen'),
  (6,  6, 'Engineering site rebuild',     'draft',    30, null, null, 'percent', 0.00, 8.00, null),
  (7,  7, 'Course platform MVP',          'sent',      4,  9, null, 'percent', 7.50, 8.00, null),
  (8,  8, 'Website maintenance 2027',     'viewed',    6,  5, null, 'amount', 0.00, 8.00, null),
  (9,  1, 'Driver app discovery',         'sent',     -3, 33, null, 'amount', 0.00, 8.00, null),
  (10, 3, 'Holiday campaign copy',        'accepted', 5,  6,  2, 'amount', 0.00, 8.00, 'Sofia Rossi'),
  (11, 2, 'Accessibility fixes',          'draft',    30, null, null, 'amount', 0.00, 8.00, null),
  (12, 4, 'Investor deck design',         'declined', 8, 11,  4, 'percent', 15.00, 8.00, 'Noah Kim')
) as q(n, customer_n, title, status, valid_offset, sent_ago, responded_ago, discount_type, discount_value, tax_percent, client_name);

insert into public.quotes (
  id, workspace_id, customer_id, number, title, status, currency, valid_until,
  discount_type, discount_value, tax_percent, sent_at, viewed_at, responded_at, client_name,
  share_token_hash, created_by, created_at
)
select
  ('dddddddd-dddd-4ddd-8ddd-' || lpad(n::text, 12, '0'))::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ('cccccccc-cccc-4ccc-8ccc-' || lpad(customer_n::text, 12, '0'))::uuid,
  'Q-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0'),
  title, status::public.quote_status, 'USD', current_date + valid_offset,
  discount_type::public.discount_type, discount_value, tax_percent,
  now() - make_interval(days => sent_ago),
  case when status in ('viewed', 'accepted', 'declined') then now() - make_interval(days => coalesce(responded_ago, sent_ago - 1)) end,
  now() - make_interval(days => responded_ago),
  client_name,
  case
    when n = 2 then encode(extensions.digest('folio-demo-quote', 'sha256'), 'hex')
    when status <> 'draft' then encode(extensions.digest('seed-token-' || n, 'sha256'), 'hex')
  end,
  case when n % 2 = 0 then '22222222-2222-4222-8222-222222222222'::uuid else '11111111-1111-4111-8111-111111111111'::uuid end,
  now() - make_interval(days => coalesce(sent_ago, 0) + 2)
from seed_quotes;

update public.workspaces set quote_seq = 12 where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

-- Items: (quote n, position, catalog name, quantity)
insert into public.quote_items
  (quote_id, workspace_id, position, catalog_item_id, name, unit, quantity, unit_price_minor, line_total_minor)
select
  ('dddddddd-dddd-4ddd-8ddd-' || lpad(i.n::text, 12, '0'))::uuid,
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  i.position, c.id, c.name, c.unit, i.quantity, c.unit_price_minor,
  round(i.quantity * c.unit_price_minor)
from (values
  (1, 1, 'Discovery workshop', 1), (1, 2, 'UX design', 8), (1, 3, 'Front-end development', 12),
  (2, 1, 'Discovery workshop', 1), (2, 2, 'UX design', 4.5),
  (3, 1, 'Brand identity', 1), (3, 2, 'Copywriting', 16),
  (4, 1, 'UX design', 6), (4, 2, 'Front-end development', 4),
  (5, 1, 'Photography', 2), (5, 2, 'Copywriting', 6),
  (6, 1, 'Discovery workshop', 1), (6, 2, 'Front-end development', 15), (6, 3, 'Back-end development', 10),
  (7, 1, 'UX design', 5), (7, 2, 'Front-end development', 10), (7, 3, 'Back-end development', 12),
  (8, 1, 'Hosting & maintenance', 12),
  (9, 1, 'Discovery workshop', 1), (9, 2, 'UX design', 3),
  (10, 1, 'Copywriting', 24),
  (11, 1, 'Front-end development', 3.5),
  (12, 1, 'Brand identity', 1), (12, 2, 'UX design', 2)
) as i(n, position, catalog_name, quantity)
join public.catalog_items c on c.name = i.catalog_name;

-- Totals with the same half-up rules as calcQuoteTotals (packages/shared/src/money.ts).
-- apps/api/test/seed.contract.spec.ts recomputes them with the shared function.
update public.quotes q set
  subtotal_minor = t.subtotal,
  discount_minor = t.discount,
  tax_minor = round((t.subtotal - t.discount) * q.tax_percent / 100),
  total_minor = (t.subtotal - t.discount) + round((t.subtotal - t.discount) * q.tax_percent / 100)
from (
  select q2.id, s.subtotal,
    case when q2.discount_type = 'percent' then round(s.subtotal * q2.discount_value / 100)
         else least(round(q2.discount_value), s.subtotal) end as discount
  from public.quotes q2
  join (select quote_id, sum(line_total_minor) as subtotal from public.quote_items group by quote_id) s on s.quote_id = q2.id
) t
where t.id = q.id;

-- Activity
insert into public.quote_events (quote_id, workspace_id, type, actor_id, created_at)
select id, workspace_id, 'created', created_by, created_at from public.quotes;
insert into public.quote_events (quote_id, workspace_id, type, actor_id, created_at)
select id, workspace_id, 'sent', created_by, sent_at from public.quotes where sent_at is not null;
insert into public.quote_events (quote_id, workspace_id, type, created_at)
select id, workspace_id, 'viewed', viewed_at from public.quotes where viewed_at is not null;
insert into public.quote_events (quote_id, workspace_id, type, created_at)
select id, workspace_id, status::text::public.quote_event_type, responded_at
from public.quotes where status in ('accepted', 'declined');

drop table seed_quotes;

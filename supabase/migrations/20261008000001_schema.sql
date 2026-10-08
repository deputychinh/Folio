-- Folio schema: enums, tables, indexes.
-- Enum values must match packages/shared/src/enums.ts (checked by apps/api/test/enums.contract.spec.ts).

create type public.workspace_role   as enum ('owner', 'admin', 'member');
create type public.quote_status     as enum ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired');
create type public.quote_event_type as enum ('created', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'duplicated');
create type public.currency_code    as enum ('USD', 'EUR', 'GBP', 'SGD', 'AUD', 'VND');
create type public.catalog_unit     as enum ('hour', 'day', 'item', 'month', 'project');
create type public.discount_type    as enum ('percent', 'amount');
create type public.invite_status    as enum ('pending', 'accepted', 'revoked');

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  created_at timestamptz not null default now()
);

create table public.workspaces (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  currency     public.currency_code not null default 'USD',
  tax_percent  numeric(5, 2) not null default 0 check (tax_percent between 0 and 50),
  brand_accent text check (brand_accent ~ '^#[0-9A-Fa-f]{6}$'),
  logo_path    text,
  quote_seq    integer not null default 0,
  created_by   uuid not null references auth.users (id),
  created_at   timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         public.workspace_role not null default 'member',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

create table public.invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email        text not null,
  role         public.workspace_role not null default 'member' check (role <> 'owner'),
  status       public.invite_status not null default 'pending',
  token_hash   text not null unique,
  invited_by   uuid not null references auth.users (id),
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);
create index invites_workspace_idx on public.invites (workspace_id, status);

create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_name text not null check (char_length(company_name) between 1 and 120),
  contact_name text not null default '',
  email        text not null default '',
  phone        text not null default '',
  address      text not null default '',
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index customers_workspace_name_idx on public.customers (workspace_id, lower(company_name));

create table public.catalog_items (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 120),
  description      text not null default '',
  unit             public.catalog_unit not null default 'item',
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);
create index catalog_items_workspace_idx on public.catalog_items (workspace_id, active, lower(name));

create table public.quotes (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  customer_id      uuid not null references public.customers (id),
  number           text not null,
  title            text not null check (char_length(title) between 1 and 140),
  status           public.quote_status not null default 'draft',
  currency         public.currency_code not null,
  valid_until      date not null,
  discount_type    public.discount_type not null default 'amount',
  discount_value   numeric(14, 2) not null default 0 check (discount_value >= 0),
  tax_percent      numeric(5, 2) not null default 0 check (tax_percent between 0 and 50),
  subtotal_minor   bigint not null default 0,
  discount_minor   bigint not null default 0,
  tax_minor        bigint not null default 0,
  total_minor      bigint not null default 0,
  notes            text not null default '',
  share_token_hash text unique,
  sent_at          timestamptz,
  viewed_at        timestamptz,
  responded_at     timestamptz,
  client_name      text,
  decline_reason   text,
  created_by       uuid not null references auth.users (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (workspace_id, number)
);
create index quotes_workspace_status_idx on public.quotes (workspace_id, status, created_at desc);
create index quotes_customer_idx on public.quotes (customer_id);

create table public.quote_items (
  id               uuid primary key default gen_random_uuid(),
  quote_id         uuid not null references public.quotes (id) on delete cascade,
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  position         integer not null,
  catalog_item_id  uuid references public.catalog_items (id) on delete set null,
  name             text not null,
  unit             public.catalog_unit not null,
  quantity         numeric(12, 2) not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null
);
create index quote_items_quote_idx on public.quote_items (quote_id, position);

create table public.quote_events (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type         public.quote_event_type not null,
  actor_id     uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index quote_events_quote_idx on public.quote_events (quote_id, created_at);
create index quote_events_workspace_idx on public.quote_events (workspace_id, created_at desc);

create table public.rate_limit_hits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 1,
  primary key (key, window_start)
);

-- A profile row for every new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quotes as the app reads them: customer name joined, and open quotes past
-- their date shown as expired (the same rule as effectiveStatus in shared).
create view public.quotes_view with (security_invoker = true) as
select
  q.*,
  case
    when q.status in ('sent', 'viewed') and q.valid_until < current_date then 'expired'::public.quote_status
    else q.status
  end as effective_status,
  c.company_name as customer_name
from public.quotes q
join public.customers c on c.id = q.customer_id;

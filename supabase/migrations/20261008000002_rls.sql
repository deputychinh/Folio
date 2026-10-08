-- Row Level Security. A user only sees rows of workspaces they belong to.
-- Quotes, items, events and memberships have no write policies: they change
-- only through the functions in 20261008000003_functions.sql.

create function public.is_member(ws uuid, roles public.workspace_role[] default null)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and (roles is null or m.role = any (roles))
  );
$$;

alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invites           enable row level security;
alter table public.customers         enable row level security;
alter table public.catalog_items     enable row level security;
alter table public.quotes            enable row level security;
alter table public.quote_items       enable row level security;
alter table public.quote_events      enable row level security;
alter table public.rate_limit_hits   enable row level security;

-- profiles: yourself, and people who share a workspace with you
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or exists (
    select 1 from public.workspace_members mine
    join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy workspaces_select on public.workspaces for select to authenticated
  using (public.is_member(id));
create policy workspaces_update on public.workspaces for update to authenticated
  using (public.is_member(id, '{owner,admin}')) with check (public.is_member(id, '{owner,admin}'));

create policy members_select on public.workspace_members for select to authenticated
  using (public.is_member(workspace_id));

create policy invites_select on public.invites for select to authenticated
  using (public.is_member(workspace_id, '{owner,admin}'));
create policy invites_insert on public.invites for insert to authenticated
  with check (public.is_member(workspace_id, '{owner,admin}') and invited_by = auth.uid());
create policy invites_update on public.invites for update to authenticated
  using (public.is_member(workspace_id, '{owner,admin}')) with check (public.is_member(workspace_id, '{owner,admin}'));

create policy customers_select on public.customers for select to authenticated
  using (public.is_member(workspace_id));
create policy customers_insert on public.customers for insert to authenticated
  with check (public.is_member(workspace_id));
create policy customers_update on public.customers for update to authenticated
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

create policy catalog_select on public.catalog_items for select to authenticated
  using (public.is_member(workspace_id));
create policy catalog_insert on public.catalog_items for insert to authenticated
  with check (public.is_member(workspace_id));
create policy catalog_update on public.catalog_items for update to authenticated
  using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));

create policy quotes_select on public.quotes for select to authenticated
  using (public.is_member(workspace_id));
create policy quote_items_select on public.quote_items for select to authenticated
  using (public.is_member(workspace_id));
create policy quote_events_select on public.quote_events for select to authenticated
  using (public.is_member(workspace_id));

-- rate_limit_hits: no policy, only the service role (public API routes) touches it.

-- Nobody but the functions may delete.
revoke delete on all tables in schema public from anon, authenticated;
-- The anon role has no business with app tables at all.
revoke all on all tables in schema public from anon;

-- Every write that touches more than one row, or that must follow a rule the
-- database has to guarantee (status transitions, last owner), runs here as one
-- transaction. Errors are raised with the ErrorCode string as the message
-- (packages/shared/src/enums.ts); the API maps it to the HTTP status.

-- ---------- Workspaces and team ----------

create function public.create_workspace(p_name text, p_currency public.currency_code, p_tax_percent numeric)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;

  insert into public.workspaces (name, currency, tax_percent, created_by)
  values (p_name, p_currency, p_tax_percent, auth.uid())
  returning id into v_id;

  insert into public.workspace_members (workspace_id, user_id, role) values (v_id, auth.uid(), 'owner');
  return v_id;
end;
$$;

create function public.accept_invite(p_token_hash text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.invites;
  v_email text;
begin
  if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;

  select * into v_invite from public.invites where token_hash = p_token_hash for update;
  if not found or v_invite.status <> 'pending' or v_invite.expires_at < now() then
    raise exception 'NOT_FOUND';
  end if;

  select email into v_email from public.profiles where id = auth.uid();
  if lower(v_email) <> lower(v_invite.email) then raise exception 'FORBIDDEN'; end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_invite.workspace_id, auth.uid(), v_invite.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.invites set status = 'accepted' where id = v_invite.id;
  return v_invite.workspace_id;
end;
$$;

-- Owners and admins manage the team. Only an owner may touch an owner or make
-- someone owner, and a workspace always keeps at least one owner.
create function public.check_member_change(p_workspace_id uuid, p_user_id uuid, p_new_role public.workspace_role)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_target_role public.workspace_role;
  v_owner_count int;
begin
  if not public.is_member(p_workspace_id, '{owner,admin}') then raise exception 'FORBIDDEN'; end if;

  select role into v_target_role from public.workspace_members
  where workspace_id = p_workspace_id and user_id = p_user_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if (v_target_role = 'owner' or p_new_role = 'owner') and not public.is_member(p_workspace_id, '{owner}') then
    raise exception 'FORBIDDEN';
  end if;

  if v_target_role = 'owner' and p_new_role is distinct from 'owner' then
    select count(*) into v_owner_count from public.workspace_members
    where workspace_id = p_workspace_id and role = 'owner';
    if v_owner_count <= 1 then raise exception 'CONFLICT'; end if;
  end if;
end;
$$;

create function public.update_member_role(p_workspace_id uuid, p_user_id uuid, p_role public.workspace_role)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_member_change(p_workspace_id, p_user_id, p_role);
  update public.workspace_members set role = p_role where workspace_id = p_workspace_id and user_id = p_user_id;
end;
$$;

create function public.remove_member(p_workspace_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.check_member_change(p_workspace_id, p_user_id, null);
  delete from public.workspace_members where workspace_id = p_workspace_id and user_id = p_user_id;
end;
$$;

-- ---------- Quotes (members) ----------

-- Totals are computed by the API with calcQuoteTotals (shared) and passed in;
-- the database stores them, it does not compute them a second way.
create function public.save_quote(p_workspace_id uuid, p_quote_id uuid, p_quote jsonb, p_items jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := p_quote_id;
  v_status public.quote_status;
  v_seq int;
  v_currency public.currency_code;
begin
  if not public.is_member(p_workspace_id) then raise exception 'FORBIDDEN'; end if;

  if not exists (
    select 1 from public.customers
    where id = (p_quote ->> 'customer_id')::uuid and workspace_id = p_workspace_id and archived_at is null
  ) then
    raise exception 'VALIDATION_ERROR';
  end if;

  if v_id is null then
    update public.workspaces set quote_seq = quote_seq + 1 where id = p_workspace_id
    returning quote_seq, currency into v_seq, v_currency;

    insert into public.quotes (workspace_id, customer_id, number, title, currency, valid_until, created_by)
    values (
      p_workspace_id,
      (p_quote ->> 'customer_id')::uuid,
      'Q-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0'),
      p_quote ->> 'title',
      v_currency,
      (p_quote ->> 'valid_until')::date,
      auth.uid()
    )
    returning id into v_id;

    insert into public.quote_events (quote_id, workspace_id, type, actor_id)
    values (v_id, p_workspace_id, 'created', auth.uid());
  else
    select status into v_status from public.quotes
    where id = v_id and workspace_id = p_workspace_id for update;
    if not found then raise exception 'NOT_FOUND'; end if;
    if v_status <> 'draft' then raise exception 'INVALID_TRANSITION'; end if;
  end if;

  update public.quotes set
    customer_id    = (p_quote ->> 'customer_id')::uuid,
    title          = p_quote ->> 'title',
    valid_until    = (p_quote ->> 'valid_until')::date,
    discount_type  = (p_quote ->> 'discount_type')::public.discount_type,
    discount_value = (p_quote ->> 'discount_value')::numeric,
    tax_percent    = (p_quote ->> 'tax_percent')::numeric,
    notes          = coalesce(p_quote ->> 'notes', ''),
    subtotal_minor = (p_quote ->> 'subtotal_minor')::bigint,
    discount_minor = (p_quote ->> 'discount_minor')::bigint,
    tax_minor      = (p_quote ->> 'tax_minor')::bigint,
    total_minor    = (p_quote ->> 'total_minor')::bigint,
    updated_at     = now()
  where id = v_id;

  delete from public.quote_items where quote_id = v_id;
  insert into public.quote_items
    (quote_id, workspace_id, position, catalog_item_id, name, unit, quantity, unit_price_minor, line_total_minor)
  select
    v_id, p_workspace_id, item.ordinality::int,
    nullif(item.value ->> 'catalog_item_id', '')::uuid,
    item.value ->> 'name',
    (item.value ->> 'unit')::public.catalog_unit,
    (item.value ->> 'quantity')::numeric,
    (item.value ->> 'unit_price_minor')::bigint,
    (item.value ->> 'line_total_minor')::bigint
  from jsonb_array_elements(p_items) with ordinality as item(value, ordinality);

  return v_id;
end;
$$;

-- DRAFT → SENT with a new link. Sending an open quote again only replaces the
-- link (the old one stops working); the status stays.
create function public.send_quote(p_workspace_id uuid, p_quote_id uuid, p_token_hash text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes;
begin
  if not public.is_member(p_workspace_id) then raise exception 'FORBIDDEN'; end if;

  select * into v_quote from public.quotes where id = p_quote_id and workspace_id = p_workspace_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_quote.status not in ('draft', 'sent', 'viewed') then raise exception 'INVALID_TRANSITION'; end if;
  if v_quote.valid_until < current_date then raise exception 'QUOTE_EXPIRED'; end if;
  if not exists (select 1 from public.quote_items where quote_id = p_quote_id) then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.quotes set
    status = case when status = 'draft' then 'sent'::public.quote_status else status end,
    sent_at = coalesce(sent_at, now()),
    share_token_hash = p_token_hash,
    updated_at = now()
  where id = p_quote_id;

  insert into public.quote_events (quote_id, workspace_id, type, actor_id)
  values (p_quote_id, p_workspace_id, 'sent', auth.uid());
end;
$$;

create function public.duplicate_quote(p_workspace_id uuid, p_quote_id uuid, p_valid_until date)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_source public.quotes;
  v_seq int;
  v_id uuid;
begin
  if not public.is_member(p_workspace_id) then raise exception 'FORBIDDEN'; end if;

  select * into v_source from public.quotes where id = p_quote_id and workspace_id = p_workspace_id;
  if not found then raise exception 'NOT_FOUND'; end if;

  update public.workspaces set quote_seq = quote_seq + 1 where id = p_workspace_id returning quote_seq into v_seq;

  insert into public.quotes (
    workspace_id, customer_id, number, title, currency, valid_until, discount_type, discount_value,
    tax_percent, subtotal_minor, discount_minor, tax_minor, total_minor, notes, created_by
  ) values (
    p_workspace_id, v_source.customer_id,
    'Q-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0'),
    v_source.title, v_source.currency, p_valid_until, v_source.discount_type, v_source.discount_value,
    v_source.tax_percent, v_source.subtotal_minor, v_source.discount_minor, v_source.tax_minor,
    v_source.total_minor, v_source.notes, auth.uid()
  ) returning id into v_id;

  insert into public.quote_items
    (quote_id, workspace_id, position, catalog_item_id, name, unit, quantity, unit_price_minor, line_total_minor)
  select v_id, workspace_id, position, catalog_item_id, name, unit, quantity, unit_price_minor, line_total_minor
  from public.quote_items where quote_id = p_quote_id;

  insert into public.quote_events (quote_id, workspace_id, type, actor_id)
  values (v_id, p_workspace_id, 'duplicated', auth.uid());
  return v_id;
end;
$$;

-- Numbers for the dashboard. Runs as the caller, so RLS scopes it.
create function public.dashboard_summary(p_workspace_id uuid, p_window_days int)
returns jsonb
language sql stable security invoker set search_path = '' as $$
  with q as (
    select * from public.quotes_view where workspace_id = p_workspace_id
  ),
  decided as (
    select effective_status from q
    where (effective_status in ('accepted', 'declined') and responded_at >= now() - make_interval(days => p_window_days))
       or (effective_status = 'expired' and valid_until >= current_date - p_window_days)
  )
  select jsonb_build_object(
    'open_value_minor', coalesce((select sum(total_minor) from q where effective_status in ('sent', 'viewed')), 0),
    'open_count', (select count(*) from q where effective_status in ('sent', 'viewed')),
    'won_value_minor', coalesce((select sum(total_minor) from q
                                 where effective_status = 'accepted'
                                   and responded_at >= now() - make_interval(days => p_window_days)), 0),
    'won_count', (select count(*) from decided where effective_status = 'accepted'),
    'decided_count', (select count(*) from decided)
  );
$$;

-- ---------- Public quote (client, called by the API with the service role) ----------

-- Opening the link: expire it if overdue, mark the first view, return the client view.
create function public.get_public_quote(p_token_hash text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes;
begin
  select * into v_quote from public.quotes where share_token_hash = p_token_hash for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  if v_quote.status in ('sent', 'viewed') and v_quote.valid_until < current_date then
    update public.quotes set status = 'expired', updated_at = now() where id = v_quote.id;
    insert into public.quote_events (quote_id, workspace_id, type) values (v_quote.id, v_quote.workspace_id, 'expired');
  elsif v_quote.status = 'sent' then
    update public.quotes set status = 'viewed', viewed_at = now(), updated_at = now() where id = v_quote.id;
    insert into public.quote_events (quote_id, workspace_id, type) values (v_quote.id, v_quote.workspace_id, 'viewed');
  end if;

  select * into v_quote from public.quotes where id = v_quote.id;

  return (
    select jsonb_build_object(
      'number', v_quote.number,
      'title', v_quote.title,
      'status', v_quote.status,
      'currency', v_quote.currency,
      'valid_until', v_quote.valid_until,
      'sent_at', v_quote.sent_at,
      'notes', v_quote.notes,
      'discount_type', v_quote.discount_type,
      'discount_value', v_quote.discount_value,
      'tax_percent', v_quote.tax_percent,
      'subtotal_minor', v_quote.subtotal_minor,
      'discount_minor', v_quote.discount_minor,
      'tax_minor', v_quote.tax_minor,
      'total_minor', v_quote.total_minor,
      'client_name', v_quote.client_name,
      'responded_at', v_quote.responded_at,
      'seller', jsonb_build_object('name', w.name, 'logo_path', w.logo_path, 'brand_accent', w.brand_accent),
      'customer', jsonb_build_object('company_name', c.company_name, 'contact_name', c.contact_name),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'name', i.name, 'unit', i.unit, 'quantity', i.quantity,
          'unit_price_minor', i.unit_price_minor, 'line_total_minor', i.line_total_minor
        ) order by i.position)
        from public.quote_items i where i.quote_id = v_quote.id
      ), '[]'::jsonb)
    )
    from public.workspaces w, public.customers c
    where w.id = v_quote.workspace_id and c.id = v_quote.customer_id
  );
end;
$$;

create function public.respond_public_quote(p_token_hash text, p_accept boolean, p_client_name text, p_reason text)
returns public.quote_status
language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes;
  v_status public.quote_status := case when p_accept then 'accepted' else 'declined' end;
begin
  select * into v_quote from public.quotes where share_token_hash = p_token_hash for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_quote.status not in ('sent', 'viewed') then raise exception 'INVALID_TRANSITION'; end if;
  if v_quote.valid_until < current_date then raise exception 'QUOTE_EXPIRED'; end if;

  update public.quotes set
    status = v_status,
    responded_at = now(),
    viewed_at = coalesce(viewed_at, now()),
    client_name = p_client_name,
    decline_reason = case when p_accept then null else nullif(p_reason, '') end,
    updated_at = now()
  where id = v_quote.id;

  insert into public.quote_events (quote_id, workspace_id, type)
  values (v_quote.id, v_quote.workspace_id, v_status::text::public.quote_event_type);
  return v_status;
end;
$$;

-- Fixed-window counter. Returns false once the key is over the limit.
create function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count int;
begin
  insert into public.rate_limit_hits (key, window_start) values (p_key, v_window)
  on conflict (key, window_start) do update set count = public.rate_limit_hits.count + 1
  returning count into v_count;

  delete from public.rate_limit_hits where window_start < now() - make_interval(secs => p_window_seconds * 10);
  return v_count <= p_limit;
end;
$$;

-- ---------- Who may call what ----------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_member(uuid, public.workspace_role[]),
  public.create_workspace(text, public.currency_code, numeric),
  public.accept_invite(text),
  public.update_member_role(uuid, uuid, public.workspace_role),
  public.remove_member(uuid, uuid),
  public.save_quote(uuid, uuid, jsonb, jsonb),
  public.send_quote(uuid, uuid, text),
  public.duplicate_quote(uuid, uuid, date),
  public.dashboard_summary(uuid, int)
to authenticated;

grant execute on function
  public.get_public_quote(text),
  public.respond_public_quote(text, boolean, text, text),
  public.rate_limit_hit(text, int, int)
to service_role;

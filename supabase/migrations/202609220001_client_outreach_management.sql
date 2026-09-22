create type public.client_lifecycle_status as enum ('prospect', 'active', 'inactive');
create type public.client_outreach_channel as enum (
  'phone', 'email', 'whatsapp', 'message', 'in_person', 'other'
);
create type public.client_outreach_response as enum (
  'interested', 'needs_time', 'declined', 'no_response', 'booked', 'other'
);
create type public.client_follow_up_status as enum ('open', 'completed');

alter table public.clients
add column lifecycle_status public.client_lifecycle_status not null default 'active';

alter table public.clients
add constraint clients_id_practitioner_unique unique (id, practitioner_id);

create table public.client_outreach_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  contacted_on date not null,
  channel public.client_outreach_channel not null,
  channel_other text,
  session_offered boolean not null default false,
  response public.client_outreach_response not null,
  response_other text,
  notes text,
  follow_up_on date,
  follow_up_status public.client_follow_up_status,
  follow_up_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_outreach_client_owner_fk
    foreign key (client_id, practitioner_id)
    references public.clients(id, practitioner_id) on delete cascade,
  constraint client_outreach_channel_other_check check (
    (channel = 'other' and nullif(btrim(channel_other), '') is not null)
    or (channel <> 'other' and channel_other is null)
  ),
  constraint client_outreach_response_other_check check (
    (response = 'other' and nullif(btrim(response_other), '') is not null)
    or (response <> 'other' and response_other is null)
  ),
  constraint client_outreach_follow_up_check check (
    (follow_up_on is null and follow_up_status is null and follow_up_completed_at is null)
    or (follow_up_on is not null and follow_up_status = 'open' and follow_up_completed_at is null)
    or (follow_up_on is not null and follow_up_status = 'completed' and follow_up_completed_at is not null)
  ),
  constraint client_outreach_follow_up_date_check check (
    follow_up_on is null or follow_up_on >= contacted_on
  )
);

create index client_outreach_records_client_date_idx
on public.client_outreach_records(client_id, contacted_on desc, created_at desc);

create index client_outreach_records_practitioner_idx
on public.client_outreach_records(practitioner_id);

create unique index client_outreach_one_open_follow_up_idx
on public.client_outreach_records(client_id)
where follow_up_status = 'open';

create trigger client_outreach_records_set_updated_at
before update on public.client_outreach_records
for each row execute function public.set_updated_at();

alter table public.client_outreach_records enable row level security;

create policy "Practitioners can read their own client outreach"
on public.client_outreach_records for select to authenticated
using (
  exists (
    select 1 from public.practitioners
    where practitioners.id = client_outreach_records.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can create their own client outreach"
on public.client_outreach_records for insert to authenticated
with check (
  exists (
    select 1 from public.clients
    where clients.id = client_outreach_records.client_id
      and clients.practitioner_id = client_outreach_records.practitioner_id
  )
  and (
    exists (
    select 1 from public.practitioners
    where practitioners.id = client_outreach_records.practitioner_id
      and practitioners.user_id = auth.uid()
    )
    or public.user_has_role(auth.uid(), 'admin')
  )
);

create policy "Practitioners can update their own client outreach"
on public.client_outreach_records for update to authenticated
using (
  exists (
    select 1 from public.practitioners
    where practitioners.id = client_outreach_records.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1 from public.practitioners
    where practitioners.id = client_outreach_records.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can delete their own client outreach"
on public.client_outreach_records for delete to authenticated
using (
  exists (
    select 1 from public.practitioners
    where practitioners.id = client_outreach_records.practitioner_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create or replace function public.create_client_outreach_record(
  p_client_id uuid,
  p_contacted_on date,
  p_channel public.client_outreach_channel,
  p_channel_other text,
  p_session_offered boolean,
  p_response public.client_outreach_response,
  p_response_other text,
  p_notes text,
  p_follow_up_on date
)
returns public.client_outreach_records
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_id uuid;
  result public.client_outreach_records;
begin
  select practitioner_id into owner_id from public.clients where id = p_client_id;
  if owner_id is null then raise exception 'Client not found'; end if;

  update public.client_outreach_records
  set follow_up_status = 'completed', follow_up_completed_at = now()
  where client_id = p_client_id and follow_up_status = 'open';

  insert into public.client_outreach_records (
    client_id, practitioner_id, contacted_on, channel, channel_other,
    session_offered, response, response_other, notes, follow_up_on, follow_up_status
  ) values (
    p_client_id, owner_id, p_contacted_on, p_channel,
    case when p_channel = 'other' then nullif(btrim(p_channel_other), '') else null end,
    p_session_offered, p_response,
    case when p_response = 'other' then nullif(btrim(p_response_other), '') else null end,
    nullif(btrim(p_notes), ''), p_follow_up_on,
    case when p_follow_up_on is null then null else 'open'::public.client_follow_up_status end
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.complete_client_follow_up(p_record_id uuid)
returns public.client_outreach_records
language plpgsql
security invoker
set search_path = public
as $$
declare result public.client_outreach_records;
begin
  update public.client_outreach_records
  set follow_up_status = 'completed', follow_up_completed_at = now()
  where id = p_record_id and follow_up_status = 'open'
  returning * into result;
  if result.id is null then raise exception 'Open follow-up not found'; end if;
  return result;
end;
$$;

create or replace function public.reschedule_client_follow_up(p_record_id uuid, p_follow_up_on date)
returns public.client_outreach_records
language plpgsql
security invoker
set search_path = public
as $$
declare result public.client_outreach_records;
begin
  update public.client_outreach_records
  set follow_up_on = p_follow_up_on
  where id = p_record_id and follow_up_status = 'open'
  returning * into result;
  if result.id is null then raise exception 'Open follow-up not found'; end if;
  return result;
end;
$$;

create or replace function public.list_my_client_management(
  p_practitioner_id uuid,
  p_lifecycle_status public.client_lifecycle_status default null,
  p_follow_up_filter text default 'all',
  p_today date default current_date,
  p_offset integer default 0,
  p_limit integer default 10
)
returns table (
  id uuid, practitioner_id uuid, name text, email text, phone text, country text, city text,
  notes text, lifecycle_status public.client_lifecycle_status, created_at timestamptz,
  updated_at timestamptz, follow_up_record_id uuid, follow_up_on date, total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select c.id, c.practitioner_id, c.name, c.email, c.phone, c.country, c.city,
    c.notes, c.lifecycle_status, c.created_at, c.updated_at,
    follow_up.id, follow_up.follow_up_on, count(*) over()
  from public.clients c
  left join lateral (
    select outreach.id, outreach.follow_up_on
    from public.client_outreach_records outreach
    where outreach.client_id = c.id and outreach.follow_up_status = 'open'
    limit 1
  ) follow_up on true
  where c.practitioner_id = p_practitioner_id
    and (p_lifecycle_status is null or c.lifecycle_status = p_lifecycle_status)
    and case p_follow_up_filter
      when 'overdue' then follow_up.follow_up_on < p_today
      when 'today' then follow_up.follow_up_on = p_today
      when 'upcoming' then follow_up.follow_up_on > p_today
      when 'none' then follow_up.follow_up_on is null
      else true
    end
  order by c.updated_at desc
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.activate_client_after_session()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.client_id is not null then
    update public.clients set lifecycle_status = 'active'
    where id = new.client_id and lifecycle_status = 'prospect';
  end if;
  return new;
end;
$$;

create trigger sessions_activate_prospect
after insert on public.sessions
for each row execute function public.activate_client_after_session();

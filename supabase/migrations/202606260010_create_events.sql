create type public.event_type as enum (
  'retreat',
  'training',
  'community_gathering'
);

create type public.event_status as enum (
  'draft',
  'published',
  'cancelled'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  event_type public.event_type not null,
  location_name text not null,
  latitude double precision,
  longitude double precision,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null,
  status public.event_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_capacity_check check (capacity > 0),
  constraint events_dates_check check (ends_at > starts_at),
  constraint events_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint events_longitude_check check (longitude is null or longitude between -180 and 180)
);

create index events_status_starts_at_idx on public.events(status, starts_at);
create index events_created_by_idx on public.events(created_by);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_rsvps_event_id_idx on public.event_rsvps(event_id);
create index event_rsvps_user_id_idx on public.event_rsvps(user_id);

create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create or replace function public.rsvp_to_event(
  target_event_id uuid,
  attendee_user_id uuid
)
returns public.event_rsvps
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event public.events;
  attendee_count integer;
  rsvp public.event_rsvps;
begin
  select *
  into target_event
  from public.events
  where id = target_event_id
    and status = 'published';

  if target_event.id is null then
    raise exception 'Event is not available for RSVP';
  end if;

  select count(*)::integer
  into attendee_count
  from public.event_rsvps
  where event_id = target_event_id;

  if attendee_count >= target_event.capacity
    and not exists (
      select 1
      from public.event_rsvps
      where event_id = target_event_id
        and user_id = attendee_user_id
    )
  then
    raise exception 'Event capacity has been reached';
  end if;

  insert into public.event_rsvps (event_id, user_id)
  values (target_event_id, attendee_user_id)
  on conflict (event_id, user_id) do update
  set user_id = excluded.user_id
  returning * into rsvp;

  return rsvp;
end;
$$;

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

create policy "Published events are public"
on public.events
for select
to anon, authenticated
using (status = 'published');

create policy "Event managers can read all events"
on public.events
for select
to authenticated
using (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'));

create policy "Event managers can create events"
on public.events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'))
);

create policy "Event managers can update events"
on public.events
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'))
with check (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'));

create policy "Users can read their own RSVPs"
on public.event_rsvps
for select
to authenticated
using (
  user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

create policy "Users can RSVP as themselves"
on public.event_rsvps
for insert
to authenticated
with check (user_id = auth.uid());

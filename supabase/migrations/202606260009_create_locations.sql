create type public.location_type as enum (
  'pool',
  'spa',
  'natural_water'
);

create type public.approval_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.practitioners(id) on delete cascade,
  name text not null,
  location_type public.location_type not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  access_info text,
  status public.approval_status not null default 'pending',
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_latitude_check check (latitude between -90 and 90),
  constraint locations_longitude_check check (longitude between -180 and 180)
);

create index locations_submitted_by_idx on public.locations(submitted_by);
create index locations_status_idx on public.locations(status);
create index locations_type_idx on public.locations(location_type);
create index locations_coordinates_idx on public.locations(latitude, longitude);

create table public.location_media (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  storage_key text,
  public_url text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index location_media_location_id_idx on public.location_media(location_id);

create table public.location_reviews (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  reviewer_id uuid not null references public.users(id) on delete cascade,
  rating integer not null,
  review_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_reviews_rating_check check (rating between 1 and 5)
);

create index location_reviews_location_id_idx on public.location_reviews(location_id);
create index location_reviews_reviewer_id_idx on public.location_reviews(reviewer_id);

create trigger locations_set_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();

create trigger location_reviews_set_updated_at
before update on public.location_reviews
for each row
execute function public.set_updated_at();

create or replace function public.approve_location(
  target_location_id uuid,
  reviewer_user_id uuid
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_location public.locations;
begin
  if not (
    public.user_has_role(reviewer_user_id, 'admin')
    or public.user_has_role(reviewer_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can approve locations';
  end if;

  update public.locations
  set status = 'approved',
      approved_by = reviewer_user_id,
      approved_at = now(),
      updated_at = now()
  where id = target_location_id
  returning * into reviewed_location;

  if reviewed_location.id is null then
    raise exception 'Location not found';
  end if;

  return reviewed_location;
end;
$$;

create or replace function public.reject_location(
  target_location_id uuid,
  reviewer_user_id uuid
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  reviewed_location public.locations;
begin
  if not (
    public.user_has_role(reviewer_user_id, 'admin')
    or public.user_has_role(reviewer_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can reject locations';
  end if;

  update public.locations
  set status = 'rejected',
      approved_by = null,
      approved_at = null,
      updated_at = now()
  where id = target_location_id
  returning * into reviewed_location;

  if reviewed_location.id is null then
    raise exception 'Location not found';
  end if;

  return reviewed_location;
end;
$$;

alter table public.locations enable row level security;
alter table public.location_media enable row level security;
alter table public.location_reviews enable row level security;

create policy "Approved locations are public"
on public.locations
for select
to anon, authenticated
using (status = 'approved');

create policy "Practitioners and reviewers can read submitted locations"
on public.locations
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = locations.submitted_by
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

create policy "Practitioners can submit locations"
on public.locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = locations.submitted_by
      and practitioners.user_id = auth.uid()
  )
);

create policy "Practitioners can update their pending locations"
on public.locations
for update
to authenticated
using (
  status = 'pending'
  and exists (
    select 1
    from public.practitioners
    where practitioners.id = locations.submitted_by
      and practitioners.user_id = auth.uid()
  )
)
with check (
  status = 'pending'
  and exists (
    select 1
    from public.practitioners
    where practitioners.id = locations.submitted_by
      and practitioners.user_id = auth.uid()
  )
);

create policy "Reviewers can update locations"
on public.locations
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'))
with check (public.user_has_role(auth.uid(), 'admin') or public.user_has_role(auth.uid(), 'manager'));

create policy "Approved location media is public"
on public.location_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.locations
    where locations.id = location_media.location_id
      and locations.status = 'approved'
  )
);

create policy "Submitters and reviewers can read location media"
on public.location_media
for select
to authenticated
using (
  exists (
    select 1
    from public.locations
    join public.practitioners
      on practitioners.id = locations.submitted_by
    where locations.id = location_media.location_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
  or public.user_has_role(auth.uid(), 'manager')
);

create policy "Submitters can add media to their pending locations"
on public.location_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.locations
    join public.practitioners
      on practitioners.id = locations.submitted_by
    where locations.id = location_media.location_id
      and locations.status = 'pending'
      and practitioners.user_id = auth.uid()
  )
);

create policy "Approved location reviews are public"
on public.location_reviews
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
  )
);

create policy "Authenticated users can review approved locations"
on public.location_reviews
for insert
to authenticated
with check (
  reviewer_id = auth.uid()
  and exists (
    select 1
    from public.locations
    where locations.id = location_reviews.location_id
      and locations.status = 'approved'
  )
);

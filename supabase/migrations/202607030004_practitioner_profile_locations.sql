create table public.practitioner_locations (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  city text,
  country text,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practitioner_locations_latitude_check check (latitude between -90 and 90),
  constraint practitioner_locations_longitude_check check (longitude between -180 and 180)
);

create index practitioner_locations_practitioner_id_idx
on public.practitioner_locations(practitioner_id);

create index practitioner_locations_sort_order_idx
on public.practitioner_locations(practitioner_id, sort_order);

create trigger practitioner_locations_set_updated_at
before update on public.practitioner_locations
for each row
execute function public.set_updated_at();

insert into public.practitioner_locations (practitioner_id, latitude, longitude, sort_order)
select id, latitude, longitude, 0
from public.practitioners
where latitude is not null
  and longitude is not null
on conflict do nothing;

alter table public.practitioner_locations enable row level security;

create policy "Public profile locations are readable"
on public.practitioner_locations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and practitioners.is_public = true
  )
);

create policy "Practitioners can read their own profile locations"
on public.practitioner_locations
for select
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
      )
  )
);

create policy "Practitioners can create their own profile locations"
on public.practitioner_locations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
      )
  )
);

create policy "Practitioners can update their own profile locations"
on public.practitioner_locations
for update
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
      )
  )
)
with check (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
      )
  )
);

create policy "Practitioners can delete their own profile locations"
on public.practitioner_locations
for delete
to authenticated
using (
  exists (
    select 1
    from public.practitioners
    where practitioners.id = practitioner_locations.practitioner_id
      and (
        practitioners.user_id = auth.uid()
        or public.user_has_role(auth.uid(), 'admin')
      )
  )
);

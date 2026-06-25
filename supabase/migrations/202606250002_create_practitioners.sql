create table public.practitioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[] not null default '{}',
  website text,
  profile_image_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practitioners_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint practitioners_longitude_check check (longitude is null or longitude between -180 and 180)
);

create index practitioners_user_id_idx on public.practitioners(user_id);
create index practitioners_public_idx on public.practitioners(is_public) where is_public = true;
create index practitioners_country_city_idx on public.practitioners(country, city);

create trigger practitioners_set_updated_at
before update on public.practitioners
for each row
execute function public.set_updated_at();

alter table public.practitioners enable row level security;

create policy "Public profiles are readable"
on public.practitioners
for select
to anon, authenticated
using (is_public = true);

create policy "Practitioners can read their own profile"
on public.practitioners
for select
to authenticated
using (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

create policy "Practitioners can create their own profile"
on public.practitioners
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Practitioners can update their own profile"
on public.practitioners
for update
to authenticated
using (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'))
with check (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

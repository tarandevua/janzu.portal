create extension if not exists pgcrypto;

create type public.app_role as enum (
  'admin',
  'manager',
  'facilitator',
  'practitioner',
  'apprentice'
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name public.app_role not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create index user_roles_user_id_idx on public.user_roles(user_id);
create index user_roles_role_id_idx on public.user_roles(role_id);
create index user_roles_assigned_by_idx on public.user_roles(assigned_by);

insert into public.roles (name, description)
values
  ('admin', 'Full platform administration access.'),
  ('manager', 'Operational management access.'),
  ('facilitator', 'Session facilitation access.'),
  ('practitioner', 'Practitioner dashboard and private client access.'),
  ('apprentice', 'Default apprentice portal access.')
on conflict (name) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name);

  insert into public.user_roles (user_id, role_id)
  select new.id, roles.id
  from public.roles
  where roles.name = 'apprentice'
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

insert into public.users (id, email, full_name)
select
  auth_users.id,
  coalesce(auth_users.email, ''),
  auth_users.raw_user_meta_data ->> 'full_name'
from auth.users as auth_users
on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.users.full_name);

insert into public.user_roles (user_id, role_id)
select users.id, roles.id
from public.users
cross join public.roles
where roles.name = 'apprentice'
  and not exists (
    select 1
    from public.user_roles
    where user_roles.user_id = users.id
  )
on conflict do nothing;

create or replace function public.user_has_role(target_user_id uuid, role_name public.app_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    join public.roles on roles.id = user_roles.role_id
    where user_roles.user_id = target_user_id
      and roles.name = role_name
  );
$$;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

create policy "Users can read their own profile"
on public.users
for select
to authenticated
using (id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

create policy "Admins can update users"
on public.users
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin'))
with check (public.user_has_role(auth.uid(), 'admin'));

create policy "Authenticated users can read roles"
on public.roles
for select
to authenticated
using (true);

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

create policy "Admins can manage user roles"
on public.user_roles
for all
to authenticated
using (public.user_has_role(auth.uid(), 'admin'))
with check (public.user_has_role(auth.uid(), 'admin'));

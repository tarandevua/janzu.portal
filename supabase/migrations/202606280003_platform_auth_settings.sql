create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row
execute function public.set_updated_at();

insert into public.platform_settings (key, value, description)
values (
  'allow_unknown_magic_link_login',
  'true'::jsonb,
  'Allow public magic-link login requests to create auth users that are not already in public.users.'
)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;

create policy "Admins can read platform settings"
on public.platform_settings
for select
to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

create policy "Admins can update platform settings"
on public.platform_settings
for update
to authenticated
using (public.user_has_role(auth.uid(), 'admin'))
with check (public.user_has_role(auth.uid(), 'admin'));

-- Repair the Auth -> portal-user synchronization used by invitations.
--
-- An Auth user without a matching public.users row cannot receive a role because
-- public.user_roles.user_id references public.users.id. Reinstall the trigger and
-- repair existing orphans without changing established portal users or roles.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_locale text;
begin
  metadata_locale := case
    when new.raw_user_meta_data ->> 'preferred_locale' in ('en', 'es')
      then new.raw_user_meta_data ->> 'preferred_locale'
    else null
  end;

  insert into public.users (
    id,
    email,
    full_name,
    official_full_name,
    preferred_locale
  ) values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'full_name',
    metadata_locale
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        official_full_name = coalesce(
          excluded.official_full_name,
          public.users.official_full_name
        ),
        preferred_locale = coalesce(
          public.users.preferred_locale,
          excluded.preferred_locale
        );

  insert into public.user_roles (user_id, role_id)
  select new.id, roles.id
  from public.roles
  where roles.name = 'apprentice'
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- Backfill only Auth users that do not yet have a portal user. Keep the repaired
-- IDs in the CTE so the default role is limited to those repaired rows.
with repaired_users as (
  insert into public.users (
    id,
    email,
    full_name,
    official_full_name,
    preferred_locale
  )
  select
    auth_users.id,
    coalesce(auth_users.email, ''),
    auth_users.raw_user_meta_data ->> 'full_name',
    auth_users.raw_user_meta_data ->> 'full_name',
    case
      when auth_users.raw_user_meta_data ->> 'preferred_locale' in ('en', 'es')
        then auth_users.raw_user_meta_data ->> 'preferred_locale'
      else null
    end
  from auth.users as auth_users
  where not exists (
    select 1
    from public.users as portal_users
    where portal_users.id = auth_users.id
  )
  on conflict (id) do nothing
  returning id
)
insert into public.user_roles (user_id, role_id)
select repaired_users.id, roles.id
from repaired_users
join public.roles on roles.name = 'apprentice'
on conflict do nothing;


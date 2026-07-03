insert into public.roles (name, description)
values ('apprentice', 'Default apprentice portal access.')
on conflict (name) do update
  set description = excluded.description;

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

create or replace function public.can_manage_user_role(
  actor_user_id uuid,
  target_role public.app_role
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.user_has_role(actor_user_id, 'admin')
    or (
      public.user_has_role(actor_user_id, 'manager')
      and target_role in ('facilitator', 'practitioner', 'apprentice')
    );
$$;

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

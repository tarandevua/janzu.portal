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
      and target_role in ('facilitator', 'practitioner')
    );
$$;

create or replace function public.list_user_role_management(actor_user_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  roles public.app_role[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can manage users';
  end if;

  return query
  select
    users.id as user_id,
    users.email,
    users.full_name,
    users.created_at,
    coalesce(
      array_agg(roles.name order by roles.name) filter (where roles.name is not null),
      '{}'::public.app_role[]
    ) as roles
  from public.users
  left join public.user_roles on user_roles.user_id = users.id
  left join public.roles on roles.id = user_roles.role_id
  group by users.id, users.email, users.full_name, users.created_at
  order by users.created_at desc;
end;
$$;

create or replace function public.assign_user_role(
  actor_user_id uuid,
  target_user_id uuid,
  target_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role_id uuid;
begin
  if not public.can_manage_user_role(actor_user_id, target_role) then
    raise exception 'You do not have permission to assign this role';
  end if;

  select id into target_role_id
  from public.roles
  where name = target_role;

  if target_role_id is null then
    raise exception 'Role does not exist';
  end if;

  insert into public.user_roles (user_id, role_id, assigned_by)
  values (target_user_id, target_role_id, actor_user_id)
  on conflict (user_id, role_id) do nothing;
end;
$$;

create or replace function public.remove_user_role(
  actor_user_id uuid,
  target_user_id uuid,
  target_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role_id uuid;
  admin_count integer;
begin
  if not public.can_manage_user_role(actor_user_id, target_role) then
    raise exception 'You do not have permission to remove this role';
  end if;

  if target_role = 'admin' then
    select count(*)::integer
    into admin_count
    from public.user_roles
    join public.roles on roles.id = user_roles.role_id
    where roles.name = 'admin';

    if admin_count <= 1 then
      raise exception 'At least one admin must remain';
    end if;
  end if;

  select id into target_role_id
  from public.roles
  where name = target_role;

  if target_role_id is null then
    raise exception 'Role does not exist';
  end if;

  delete from public.user_roles
  where user_id = target_user_id
    and role_id = target_role_id;
end;
$$;

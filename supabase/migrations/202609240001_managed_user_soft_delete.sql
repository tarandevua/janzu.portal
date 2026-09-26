alter table public.users
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references public.users(id) on delete set null;

create index if not exists users_deleted_at_idx
on public.users(deleted_at desc)
where is_deleted = true;

update public.users
set deleted_at = coalesce(deleted_at, updated_at, created_at)
where is_deleted = true
  and deleted_at is null;

revoke update on table public.users from authenticated;

create or replace function public.user_has_role(
  target_user_id uuid,
  role_name public.app_role
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    join public.user_roles on user_roles.user_id = users.id
    join public.roles on roles.id = user_roles.role_id
    where users.id = target_user_id
      and users.is_deleted = false
      and roles.name = role_name
  );
$$;

create or replace function public.soft_delete_managed_user(
  actor_user_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_user_id uuid;
begin
  if auth.uid() is null
    or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  if actor_user_id = target_user_id then
    raise exception 'Administrators cannot delete their own account' using errcode = '42501';
  end if;

  update public.users
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = actor_user_id,
    updated_at = now()
  where id = target_user_id
    and is_deleted = false
  returning id into deleted_user_id;

  if deleted_user_id is null then
    raise exception 'Active user was not found' using errcode = 'P0002';
  end if;

  return deleted_user_id;
end;
$$;

create or replace function public.restore_deleted_managed_user(
  actor_user_id uuid,
  target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  restored_user_id uuid;
begin
  if auth.uid() is null
    or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  update public.users
  set
    is_deleted = false,
    deleted_at = null,
    deleted_by = null,
    updated_at = now()
  where id = target_user_id
    and is_deleted = true
  returning id into restored_user_id;

  if restored_user_id is null then
    raise exception 'Deleted user was not found' using errcode = 'P0002';
  end if;

  return restored_user_id;
end;
$$;

create or replace function public.list_deleted_user_management(
  actor_user_id uuid,
  page_number integer default 1,
  page_size integer default 10,
  search_query text default null
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_by_email text,
  deleted_by_full_name text,
  total_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_page integer := greatest(coalesce(page_number, 1), 1);
  safe_page_size integer := least(greatest(coalesce(page_size, 10), 1), 100);
  normalized_search text := nullif(trim(coalesce(search_query, '')), '');
begin
  if auth.uid() is null
    or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  return query
  select
    deleted_user.id,
    deleted_user.email,
    deleted_user.full_name,
    deleted_user.created_at,
    deleted_user.deleted_at,
    deleted_user.deleted_by,
    deleting_user.email,
    deleting_user.full_name,
    count(*) over ()::integer
  from public.users deleted_user
  left join public.users deleting_user on deleting_user.id = deleted_user.deleted_by
  where deleted_user.is_deleted = true
    and (
      normalized_search is null
      or deleted_user.email ilike '%' || normalized_search || '%'
      or deleted_user.full_name ilike '%' || normalized_search || '%'
    )
  order by deleted_user.deleted_at desc nulls last, deleted_user.created_at desc
  limit safe_page_size
  offset (safe_page - 1) * safe_page_size;
end;
$$;

revoke all on function public.soft_delete_managed_user(uuid, uuid) from public, anon;
revoke all on function public.restore_deleted_managed_user(uuid, uuid) from public, anon;
revoke all on function public.list_deleted_user_management(uuid, integer, integer, text)
  from public, anon;

grant execute on function public.soft_delete_managed_user(uuid, uuid) to authenticated;
grant execute on function public.restore_deleted_managed_user(uuid, uuid) to authenticated;
grant execute on function public.list_deleted_user_management(uuid, integer, integer, text)
  to authenticated;

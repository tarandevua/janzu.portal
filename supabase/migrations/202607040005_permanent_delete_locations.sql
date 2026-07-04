create or replace function public.permanently_delete_location(
  target_location_id uuid,
  actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not exists (
    select 1
    from public.user_roles
    join public.roles
      on roles.id = user_roles.role_id
    where user_roles.user_id = actor_user_id
      and roles.name = 'admin'
  ) then
    raise exception 'Only admins can permanently delete locations';
  end if;

  delete from public.locations
  where id = target_location_id
    and is_deleted = true;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception 'Deleted location not found';
  end if;
end;
$$;

grant execute on function public.permanently_delete_location(uuid, uuid) to authenticated;

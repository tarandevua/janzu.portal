create or replace function public.list_feedback_participants(actor_user_id uuid)
returns table (
  practitioner_id uuid,
  user_id uuid,
  display_name text,
  email text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager')
  then
    return query
    with active_participants as (
      select distinct on (practitioners.user_id)
        practitioners.id as practitioner_id,
        practitioners.user_id,
        coalesce(users.full_name, users.email) as display_name,
        users.email
      from public.practitioners
      join public.users on users.id = practitioners.user_id
      where users.is_deleted = false
      order by practitioners.user_id, practitioners.created_at desc
    )
    select
      active_participants.practitioner_id,
      active_participants.user_id,
      active_participants.display_name,
      active_participants.email
    from active_participants
    order by active_participants.display_name asc;
  end if;

  return query
  select
    practitioners.id as practitioner_id,
    practitioners.user_id,
    coalesce(users.full_name, users.email) as display_name,
    users.email
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.user_id = actor_user_id
    and users.is_deleted = false
  order by display_name asc;
end;
$$;

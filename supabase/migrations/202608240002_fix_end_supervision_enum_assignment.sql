-- Preserve the TASK-202 relationship-ending boundary with enum-typed state
-- variables. PostgreSQL otherwise resolves the CASE branches as text.

create or replace function public.end_supervision(
  actor_user_id uuid,
  assignment_id uuid,
  reason text
)
returns public.supervision_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_assignment public.supervision_assignments;
  prior_assignment_status public.supervision_status;
  next_assignment_status public.supervision_status;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision changes are limited to the authenticated user'
      using errcode = '42501';
  end if;

  select * into current_assignment
  from public.supervision_assignments
  where id = assignment_id
  for update;

  if current_assignment.id is null
    or current_assignment.status not in ('pending', 'active')
    or not (
      actor_user_id in (current_assignment.trainee_user_id, current_assignment.instructor_user_id)
      or public.user_has_role(actor_user_id, 'admin')
    )
  then
    raise exception 'The supervision assignment cannot be ended'
      using errcode = '42501';
  end if;

  prior_assignment_status := current_assignment.status;
  next_assignment_status := case
    when prior_assignment_status = 'pending' then 'cancelled'::public.supervision_status
    else 'ended'::public.supervision_status
  end;

  update public.supervision_assignments
  set
    status = next_assignment_status,
    ended_by = actor_user_id,
    ended_at = now(),
    end_reason = nullif(trim(reason), '')
  where id = assignment_id
  returning * into current_assignment;

  insert into public.supervision_assignment_audit (
    assignment_id,
    actor_user_id,
    action,
    previous_status,
    resulting_status,
    reason
  ) values (
    assignment_id,
    actor_user_id,
    'ended',
    prior_assignment_status,
    next_assignment_status,
    current_assignment.end_reason
  );

  perform public.insert_notification(
    case
      when actor_user_id = current_assignment.trainee_user_id
        then current_assignment.instructor_user_id
      else current_assignment.trainee_user_id
    end,
    'supervision_ended',
    'Supervision relationship updated',
    'A supervision relationship has ended.',
    '/dashboard/supervision'
  );

  return current_assignment;
end;
$$;

revoke all on function public.end_supervision(uuid, uuid, text) from public, anon;
grant execute on function public.end_supervision(uuid, uuid, text) to authenticated;

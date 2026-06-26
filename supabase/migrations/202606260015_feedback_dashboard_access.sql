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
    select
      practitioners.id as practitioner_id,
      practitioners.user_id,
      coalesce(users.full_name, users.email) as display_name,
      users.email
    from public.practitioners
    join public.users on users.id = practitioners.user_id
    order by display_name asc;
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
  order by display_name asc;
end;
$$;

create or replace function public.list_feedback_dashboard(
  actor_user_id uuid,
  participant_filter uuid default null
)
returns table (
  feedback_id uuid,
  session_id uuid,
  practitioner_id uuid,
  practitioner_user_id uuid,
  practitioner_name text,
  practitioner_email text,
  client_name text,
  session_date date,
  rating integer,
  experience_text text,
  emotional_impact text,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  can_review_all boolean;
begin
  can_review_all := public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager');

  return query
  select
    session_feedback.id as feedback_id,
    sessions.id as session_id,
    practitioners.id as practitioner_id,
    practitioners.user_id as practitioner_user_id,
    coalesce(users.full_name, users.email) as practitioner_name,
    users.email as practitioner_email,
    clients.name as client_name,
    sessions.session_date,
    session_feedback.rating,
    session_feedback.experience_text,
    session_feedback.emotional_impact,
    session_feedback.submitted_at
  from public.session_feedback
  join public.sessions on sessions.id = session_feedback.session_id
  join public.practitioners on practitioners.id = sessions.practitioner_id
  join public.users on users.id = practitioners.user_id
  left join public.clients on clients.id = sessions.client_id
  where session_feedback.submitted_at is not null
    and (
      can_review_all
      or practitioners.user_id = actor_user_id
    )
    and (
      participant_filter is null
      or practitioners.id = participant_filter
    )
  order by session_feedback.submitted_at desc;
end;
$$;

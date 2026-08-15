-- Assigned Instructors may see only the supervision summaries required by
-- DEC-01. Participant contact data and feedback free text remain private.

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
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Feedback access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  return query
  with active_participants as (
    select distinct on (practitioners.user_id)
      practitioners.id as practitioner_id,
      practitioners.user_id,
      coalesce(users.full_name, users.email) as display_name,
      case
        when public.user_has_role(actor_user_id, 'admin')
          or practitioners.user_id = actor_user_id
        then users.email
        else ''::text
      end as email
    from public.practitioners
    join public.users on users.id = practitioners.user_id
    where users.is_deleted = false
      and (
        public.user_has_role(actor_user_id, 'admin')
        or practitioners.user_id = actor_user_id
        or public.is_active_instructor_for(actor_user_id, practitioners.user_id)
      )
    order by practitioners.user_id, practitioners.created_at desc
  )
  select
    active_participants.practitioner_id,
    active_participants.user_id,
    active_participants.display_name,
    active_participants.email
  from active_participants
  order by active_participants.display_name;
end;
$$;

create or replace function public.list_feedback_dashboard(
  actor_user_id uuid,
  participant_filter uuid default null,
  page_number integer default 1,
  page_size integer default 10,
  feedback_filter uuid default null
)
returns table (
  feedback_id uuid,
  session_id uuid,
  practitioner_id uuid,
  practitioner_user_id uuid,
  practitioner_name text,
  practitioner_email text,
  client_name text,
  participant_email text,
  session_date date,
  rating integer,
  experience_text text,
  emotional_impact text,
  felt_in_facilitator_arms text,
  support_at_end text,
  support_other_text text,
  continue_water_process text,
  interested_learning_janzu boolean,
  learning_name text,
  learning_phone text,
  anything_else text,
  gdpr_agreed boolean,
  submitted_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  safe_page integer;
  safe_page_size integer;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Feedback access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  safe_page := greatest(page_number, 1);
  safe_page_size := least(greatest(page_size, 1), 100);

  return query
  with visible_feedback as (
    select
      session_feedback.id as feedback_id,
      sessions.id as session_id,
      practitioners.id as practitioner_id,
      practitioners.user_id as practitioner_user_id,
      coalesce(users.full_name, users.email) as practitioner_name,
      case
        when public.user_has_role(actor_user_id, 'admin')
          or practitioners.user_id = actor_user_id
        then users.email
        else ''::text
      end as practitioner_email,
      case
        when public.user_has_role(actor_user_id, 'admin')
          or practitioners.user_id = actor_user_id
        then clients.name
      end as client_name,
      case
        when public.user_has_role(actor_user_id, 'admin')
          or practitioners.user_id = actor_user_id
        then session_feedback.participant_email
      end as participant_email,
      sessions.session_date,
      session_feedback.rating,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.experience_text end as experience_text,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.emotional_impact end as emotional_impact,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.felt_in_facilitator_arms end as felt_in_facilitator_arms,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.support_at_end::text end as support_at_end,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.support_other_text end as support_other_text,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.continue_water_process::text end as continue_water_process,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.interested_learning_janzu else false end as interested_learning_janzu,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.learning_name end as learning_name,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.learning_phone end as learning_phone,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.anything_else end as anything_else,
      case when public.user_has_role(actor_user_id, 'admin') or practitioners.user_id = actor_user_id
        then session_feedback.gdpr_agreed else false end as gdpr_agreed,
      session_feedback.submitted_at
    from public.session_feedback
    join public.sessions on sessions.id = session_feedback.session_id
    join public.practitioners on practitioners.id = sessions.practitioner_id
    join public.users on users.id = practitioners.user_id
    left join public.clients on clients.id = sessions.client_id
    where session_feedback.submitted_at is not null
      and (
        public.user_has_role(actor_user_id, 'admin')
        or practitioners.user_id = actor_user_id
        or public.is_active_instructor_for(actor_user_id, practitioners.user_id)
      )
      and (participant_filter is null or practitioners.id = participant_filter)
      and (feedback_filter is null or session_feedback.id = feedback_filter)
  )
  select
    visible_feedback.*,
    count(*) over () as total_count
  from visible_feedback
  order by visible_feedback.submitted_at desc
  limit safe_page_size
  offset (safe_page - 1) * safe_page_size;
end;
$$;

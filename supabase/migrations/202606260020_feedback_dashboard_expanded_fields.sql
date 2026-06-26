drop function if exists public.list_feedback_dashboard(uuid, uuid, integer, integer);

create or replace function public.list_feedback_dashboard(
  actor_user_id uuid,
  participant_filter uuid default null,
  page_number integer default 1,
  page_size integer default 10
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
  can_review_all boolean;
  safe_page integer;
  safe_page_size integer;
begin
  can_review_all := public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager');
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
      users.email as practitioner_email,
      clients.name as client_name,
      sessions.session_date,
      session_feedback.rating,
      session_feedback.experience_text,
      session_feedback.emotional_impact,
      session_feedback.felt_in_facilitator_arms,
      session_feedback.support_at_end,
      session_feedback.support_other_text,
      session_feedback.continue_water_process,
      session_feedback.interested_learning_janzu,
      session_feedback.learning_name,
      session_feedback.learning_phone,
      session_feedback.anything_else,
      session_feedback.gdpr_agreed,
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
  )
  select
    visible_feedback.feedback_id,
    visible_feedback.session_id,
    visible_feedback.practitioner_id,
    visible_feedback.practitioner_user_id,
    visible_feedback.practitioner_name,
    visible_feedback.practitioner_email,
    visible_feedback.client_name,
    visible_feedback.session_date,
    visible_feedback.rating,
    visible_feedback.experience_text,
    visible_feedback.emotional_impact,
    visible_feedback.felt_in_facilitator_arms,
    visible_feedback.support_at_end,
    visible_feedback.support_other_text,
    visible_feedback.continue_water_process,
    visible_feedback.interested_learning_janzu,
    visible_feedback.learning_name,
    visible_feedback.learning_phone,
    visible_feedback.anything_else,
    visible_feedback.gdpr_agreed,
    visible_feedback.submitted_at,
    count(*) over () as total_count
  from visible_feedback
  order by visible_feedback.submitted_at desc
  limit safe_page_size
  offset (safe_page - 1) * safe_page_size;
end;
$$;

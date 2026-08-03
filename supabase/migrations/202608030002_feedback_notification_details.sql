alter table public.notifications
add column if not exists feedback_id uuid references public.session_feedback(id) on delete set null,
add column if not exists participant_name text,
add column if not exists feedback_session_date date,
add column if not exists feedback_rating integer;

create index if not exists notifications_feedback_id_idx
on public.notifications(feedback_id)
where feedback_id is not null;

create or replace function public.notify_feedback_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
  participant_display_name text;
  related_session_date date;
  notification_id uuid;
begin
  if new.submitted_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.submitted_at is not null then
    return new;
  end if;

  select
    practitioners.user_id,
    coalesce(
      nullif(trim(clients.name), ''),
      nullif(trim(new.participant_email), ''),
      'Session participant'
    ),
    sessions.session_date
  into recipient_user_id, participant_display_name, related_session_date
  from public.sessions
  join public.practitioners on practitioners.id = sessions.practitioner_id
  left join public.clients on clients.id = sessions.client_id
  where sessions.id = new.session_id;

  notification_id := public.insert_notification(
    recipient_user_id,
    'feedback_received',
    'Feedback from ' || participant_display_name,
    participant_display_name || ' submitted feedback for your session on '
      || coalesce(to_char(related_session_date, 'YYYY-MM-DD'), 'a recent date')
      || '. Rating: ' || new.rating || '/5.',
    '/dashboard/feedback?feedbackId=' || new.id
  );

  update public.notifications
  set feedback_id = new.id,
      participant_name = participant_display_name,
      feedback_session_date = related_session_date,
      feedback_rating = new.rating
  where id = notification_id;

  return new;
end;
$$;

with feedback_notification_candidates as (
  select
    notifications.id as notification_id,
    session_feedback.id as feedback_id,
    coalesce(
      nullif(trim(clients.name), ''),
      nullif(trim(session_feedback.participant_email), ''),
      'Session participant'
    ) as participant_name,
    sessions.session_date,
    session_feedback.rating,
    row_number() over (
      partition by notifications.id
      order by abs(extract(epoch from notifications.created_at - session_feedback.submitted_at))
    ) as candidate_rank
  from public.notifications
  join public.practitioners on practitioners.user_id = notifications.user_id
  join public.sessions on sessions.practitioner_id = practitioners.id
  join public.session_feedback on session_feedback.session_id = sessions.id
  left join public.clients on clients.id = sessions.client_id
  where notifications.type = 'feedback_received'
    and notifications.feedback_id is null
    and session_feedback.submitted_at is not null
    and session_feedback.submitted_at between
      notifications.created_at - interval '5 minutes'
      and notifications.created_at + interval '5 minutes'
), matched_feedback_notifications as (
  select *
  from feedback_notification_candidates
  where candidate_rank = 1
)
update public.notifications
set feedback_id = matched_feedback_notifications.feedback_id,
    participant_name = matched_feedback_notifications.participant_name,
    feedback_session_date = matched_feedback_notifications.session_date,
    feedback_rating = matched_feedback_notifications.rating,
    title = 'Feedback from ' || matched_feedback_notifications.participant_name,
    body = matched_feedback_notifications.participant_name
      || ' submitted feedback for your session on '
      || to_char(matched_feedback_notifications.session_date, 'YYYY-MM-DD')
      || '. Rating: ' || matched_feedback_notifications.rating || '/5.',
    href = '/dashboard/feedback?feedbackId=' || matched_feedback_notifications.feedback_id,
    updated_at = now()
from matched_feedback_notifications
where notifications.id = matched_feedback_notifications.notification_id;

drop function if exists public.list_feedback_dashboard(uuid, uuid, integer, integer);

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
      session_feedback.participant_email,
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
      and (
        feedback_filter is null
        or session_feedback.id = feedback_filter
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
    visible_feedback.participant_email,
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

alter table public.session_feedback
add column if not exists participant_email text,
add column if not exists felt_in_facilitator_arms text,
add column if not exists support_at_end text,
add column if not exists support_other_text text,
add column if not exists continue_water_process text,
add column if not exists interested_learning_janzu boolean not null default false,
add column if not exists learning_name text,
add column if not exists learning_phone text,
add column if not exists anything_else text,
add column if not exists gdpr_agreed boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_feedback_support_at_end_check'
  ) then
    alter table public.session_feedback
    add constraint session_feedback_support_at_end_check
    check (support_at_end is null or support_at_end in ('yes', 'not_enough', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'session_feedback_continue_water_process_check'
  ) then
    alter table public.session_feedback
    add constraint session_feedback_continue_water_process_check
    check (
      continue_water_process is null
      or continue_water_process in ('another_session', 'no_thank_you')
    );
  end if;
end $$;

create or replace function public.submit_session_feedback(
  feedback_token text,
  feedback_participant_email text,
  feedback_rating integer,
  feedback_experience_text text,
  feedback_emotional_impact text,
  feedback_felt_in_facilitator_arms text default null,
  feedback_support_at_end text default null,
  feedback_support_other_text text default null,
  feedback_continue_water_process text default null,
  feedback_interested_learning_janzu boolean default false,
  feedback_learning_name text default null,
  feedback_learning_phone text default null,
  feedback_anything_else text default null,
  feedback_gdpr_agreed boolean default false
)
returns public.session_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_feedback public.session_feedback;
begin
  update public.session_feedback
  set participant_email = lower(nullif(trim(feedback_participant_email), '')),
      rating = feedback_rating,
      experience_text = feedback_experience_text,
      emotional_impact = feedback_emotional_impact,
      felt_in_facilitator_arms = feedback_felt_in_facilitator_arms,
      support_at_end = feedback_support_at_end,
      support_other_text = feedback_support_other_text,
      continue_water_process = feedback_continue_water_process,
      interested_learning_janzu = feedback_interested_learning_janzu,
      learning_name = feedback_learning_name,
      learning_phone = feedback_learning_phone,
      anything_else = feedback_anything_else,
      gdpr_agreed = feedback_gdpr_agreed,
      submitted_at = now()
  where token = feedback_token
    and submitted_at is null
    and feedback_rating between 1 and 5
    and nullif(trim(feedback_participant_email), '') is not null
    and feedback_gdpr_agreed = true
  returning * into updated_feedback;

  if updated_feedback.id is null then
    raise exception 'Feedback link is invalid or already submitted';
  end if;

  return updated_feedback;
end;
$$;

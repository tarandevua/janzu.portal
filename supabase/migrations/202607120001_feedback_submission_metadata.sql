alter table public.session_feedback
add column if not exists submitter_ip text,
add column if not exists submitter_user_agent text,
add column if not exists submitter_device_id text,
add column if not exists submitter_accept_language text,
add column if not exists submitter_referrer text,
add column if not exists submitter_metadata jsonb not null default '{}'::jsonb;

create index if not exists session_feedback_submitter_ip_idx
on public.session_feedback(submitter_ip)
where submitter_ip is not null;

create index if not exists session_feedback_submitter_device_id_idx
on public.session_feedback(submitter_device_id)
where submitter_device_id is not null;

drop function if exists public.submit_session_feedback(
  text,
  text,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text,
  text,
  text,
  boolean
);

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
  feedback_gdpr_agreed boolean default false,
  feedback_submitter_ip text default null,
  feedback_submitter_user_agent text default null,
  feedback_submitter_device_id text default null,
  feedback_submitter_accept_language text default null,
  feedback_submitter_referrer text default null,
  feedback_submitter_metadata jsonb default '{}'::jsonb
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
      submitter_ip = nullif(left(trim(coalesce(feedback_submitter_ip, '')), 255), ''),
      submitter_user_agent = nullif(left(trim(coalesce(feedback_submitter_user_agent, '')), 1000), ''),
      submitter_device_id = nullif(left(trim(coalesce(feedback_submitter_device_id, '')), 128), ''),
      submitter_accept_language = nullif(left(trim(coalesce(feedback_submitter_accept_language, '')), 255), ''),
      submitter_referrer = nullif(left(trim(coalesce(feedback_submitter_referrer, '')), 1000), ''),
      submitter_metadata = coalesce(feedback_submitter_metadata, '{}'::jsonb),
      submitted_at = now()
  where token = feedback_token
    and submitted_at is null
    and feedback_rating between 1 and 5
    and feedback_gdpr_agreed = true
    and nullif(trim(feedback_participant_email), '') is not null
  returning * into updated_feedback;

  if updated_feedback.id is null then
    raise exception 'Feedback link is invalid or already submitted';
  end if;

  return updated_feedback;
end;
$$;

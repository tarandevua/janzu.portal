create or replace function public.get_session_feedback_status(feedback_token text)
returns table (
  token text,
  submitted_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select session_feedback.token, session_feedback.submitted_at
  from public.session_feedback
  where session_feedback.token = feedback_token;
$$;

drop policy if exists "Public clients can read open feedback link metadata"
on public.session_feedback;

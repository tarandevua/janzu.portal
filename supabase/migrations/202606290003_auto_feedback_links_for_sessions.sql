insert into public.session_feedback (session_id, token, rating)
select
  sessions.id,
  encode(gen_random_bytes(24), 'hex'),
  5
from public.sessions
where not exists (
  select 1
  from public.session_feedback
  where session_feedback.session_id = sessions.id
);

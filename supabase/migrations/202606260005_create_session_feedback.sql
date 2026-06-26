create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  token text not null unique,
  rating integer not null,
  experience_text text,
  emotional_impact text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_feedback_rating_check check (rating between 1 and 5)
);

create index session_feedback_session_id_idx on public.session_feedback(session_id);
create index session_feedback_token_idx on public.session_feedback(token);
create index session_feedback_submitted_at_idx on public.session_feedback(submitted_at);

create trigger session_feedback_set_updated_at
before update on public.session_feedback
for each row
execute function public.set_updated_at();

create or replace function public.set_session_validated_from_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.submitted_at is not null then
    update public.sessions
    set is_validated = true,
        updated_at = now()
    where id = new.session_id;
  end if;

  return new;
end;
$$;

create trigger session_feedback_validate_session
after insert or update of submitted_at on public.session_feedback
for each row
execute function public.set_session_validated_from_feedback();

create or replace function public.submit_session_feedback(
  feedback_token text,
  feedback_rating integer,
  feedback_experience_text text,
  feedback_emotional_impact text
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
  set rating = feedback_rating,
      experience_text = feedback_experience_text,
      emotional_impact = feedback_emotional_impact,
      submitted_at = now()
  where token = feedback_token
    and submitted_at is null
    and feedback_rating between 1 and 5
  returning * into updated_feedback;

  if updated_feedback.id is null then
    raise exception 'Feedback link is invalid or already submitted';
  end if;

  return updated_feedback;
end;
$$;

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

alter table public.session_feedback enable row level security;

create policy "Practitioners can read feedback for their own sessions"
on public.session_feedback
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions
    join public.practitioners on practitioners.id = sessions.practitioner_id
    where sessions.id = session_feedback.session_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Practitioners can create feedback links for their own sessions"
on public.session_feedback
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sessions
    join public.practitioners on practitioners.id = sessions.practitioner_id
    where sessions.id = session_feedback.session_id
      and practitioners.user_id = auth.uid()
  )
);

create policy "Practitioners can update feedback links for their own sessions"
on public.session_feedback
for update
to authenticated
using (
  exists (
    select 1
    from public.sessions
    join public.practitioners on practitioners.id = sessions.practitioner_id
    where sessions.id = session_feedback.session_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
)
with check (
  exists (
    select 1
    from public.sessions
    join public.practitioners on practitioners.id = sessions.practitioner_id
    where sessions.id = session_feedback.session_id
      and practitioners.user_id = auth.uid()
  )
  or public.user_has_role(auth.uid(), 'admin')
);

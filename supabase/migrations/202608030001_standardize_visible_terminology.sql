create or replace function public.notify_feedback_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
  session_label text;
begin
  if new.submitted_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.submitted_at is not null then
    return new;
  end if;

  select practitioners.user_id, to_char(sessions.session_date, 'YYYY-MM-DD')
  into recipient_user_id, session_label
  from public.sessions
  join public.practitioners on practitioners.id = sessions.practitioner_id
  where sessions.id = new.session_id;

  perform public.insert_notification(
    recipient_user_id,
    'feedback_received',
    'Session feedback received',
    'A session participant submitted feedback for your session on ' || coalesce(session_label, 'a recent date') || '.',
    '/dashboard/sessions'
  );

  return new;
end;
$$;

update public.notifications
set body = replace(
  body,
  'A client submitted feedback',
  'A session participant submitted feedback'
)
where type = 'feedback_received'
  and body like 'A client submitted feedback%';

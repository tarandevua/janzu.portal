create type public.notification_type as enum (
  'session_request_received',
  'feedback_received',
  'location_approved',
  'event_invitation',
  'event_rsvp_received',
  'certification_progress',
  'certification_approved'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_user_read_idx on public.notifications(user_id, read_at);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_type_idx on public.notifications(type);

create trigger notifications_set_updated_at
before update on public.notifications
for each row
execute function public.set_updated_at();

create or replace function public.insert_notification(
  target_user_id uuid,
  notification_type public.notification_type,
  notification_title text,
  notification_body text default null,
  notification_href text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  if target_user_id is null then
    return null;
  end if;

  insert into public.notifications (user_id, type, title, body, href)
  values (
    target_user_id,
    notification_type,
    notification_title,
    notification_body,
    notification_href
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

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
    'A client submitted feedback for your session on ' || coalesce(session_label, 'a recent date') || '.',
    '/dashboard/sessions'
  );

  return new;
end;
$$;

create trigger session_feedback_notify_practitioner
after insert or update of submitted_at on public.session_feedback
for each row
execute function public.notify_feedback_received();

create or replace function public.notify_location_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  select user_id
  into recipient_user_id
  from public.practitioners
  where id = new.submitted_by;

  perform public.insert_notification(
    recipient_user_id,
    'location_approved',
    'Location approved',
    new.name || ' is now visible on the public location map.',
    '/dashboard/locations'
  );

  return new;
end;
$$;

create trigger locations_notify_submitter
after insert or update of status on public.locations
for each row
execute function public.notify_location_reviewed();

create or replace function public.notify_event_rsvp_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_owner_user_id uuid;
  event_title text;
  attendee_email text;
begin
  select events.created_by, events.title
  into event_owner_user_id, event_title
  from public.events
  where events.id = new.event_id;

  if event_owner_user_id is null or event_owner_user_id = new.user_id then
    return new;
  end if;

  select email
  into attendee_email
  from public.users
  where id = new.user_id;

  perform public.insert_notification(
    event_owner_user_id,
    'event_rsvp_received',
    'Event RSVP received',
    coalesce(attendee_email, 'A community member') || ' RSVP''d to ' || coalesce(event_title, 'your event') || '.',
    '/dashboard/events'
  );

  return new;
end;
$$;

create trigger event_rsvps_notify_owner
after insert on public.event_rsvps
for each row
execute function public.notify_event_rsvp_received();

create or replace function public.notify_certification_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_user_id uuid;
begin
  if new.status not in ('eligible', 'approved') then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = new.status then
    return new;
  end if;

  select user_id
  into recipient_user_id
  from public.practitioners
  where id = new.practitioner_id;

  if new.status = 'approved' then
    perform public.insert_notification(
      recipient_user_id,
      'certification_approved',
      'Certification approved',
      'Your Janzu certification has been approved.',
      '/dashboard/certification'
    );
  else
    perform public.insert_notification(
      recipient_user_id,
      'certification_progress',
      'Certification ready for review',
      'You have reached the validated session requirement for certification.',
      '/dashboard/certification'
    );
  end if;

  return new;
end;
$$;

create trigger certification_progress_notify_practitioner
after insert or update of status on public.certification_progress
for each row
execute function public.notify_certification_progress();

alter table public.notifications enable row level security;

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can mark their own notifications read"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

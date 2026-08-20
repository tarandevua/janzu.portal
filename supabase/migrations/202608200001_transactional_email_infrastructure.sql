-- TASK-502: reusable, private, idempotent transactional email outbox.

create type public.email_preference_key as enum (
  'session_updates',
  'booking_requests',
  'feedback_updates',
  'supervision_updates',
  'certification_decisions'
);

create type public.transactional_email_status as enum (
  'pending',
  'sending',
  'provider_accepted',
  'delivered',
  'retry_scheduled',
  'failed_permanent',
  'suppressed'
);

create type public.transactional_email_event_type as enum (
  'session.registered', 'booking.requested', 'feedback.received',
  'session.validated', 'session.validation_removed',
  'instructor_assignment.requested', 'instructor_assignment.accepted',
  'instructor_assignment.declined', 'instructor_assignment.cancelled',
  'instructor_assignment.ended', 'instructor_assignment.transferred',
  'certification.milestone_25_reached',
  'certification.level_2_readiness_approved',
  'certification.level_2_readiness_rejected',
  'certification.level_2_readiness_revision_required',
  'certification.level_2_readiness_overridden',
  'certification.milestone_50_reached',
  'assessment.readiness_requested', 'assessment.readiness_approved',
  'assessment.readiness_rejected', 'assessment.assessor_assigned',
  'assessment.scheduled', 'assessment.revision_required',
  'assessment.passed', 'assessment.failed', 'assessment.remediation_verified',
  'certification.approved', 'certification.suspended', 'certification.revoked',
  'certification.reinstated', 'certification.overridden',
  'certificate.issued', 'certificate.replaced', 'certificate.revoked',
  'role.assigned', 'role.removed'
);

create table public.email_preferences (
  user_id uuid not null references public.users(id) on delete cascade,
  preference_key public.email_preference_key not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, preference_key)
);

create trigger email_preferences_set_updated_at
before update on public.email_preferences
for each row execute function public.set_updated_at();

create table public.transactional_email_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.transactional_email_event_type not null,
  event_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint transactional_email_events_metadata_object
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 16384)
);

create table public.transactional_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.transactional_email_events(id) on delete restrict,
  recipient_user_id uuid not null references public.users(id) on delete restrict,
  recipient_email text not null,
  recipient_name text,
  locale text not null check (locale in ('en', 'es')),
  template_key public.transactional_email_event_type not null,
  template_version text not null default 'v1',
  destination_path text not null check (
    destination_path ~ '^/(en|es)/dashboard(/|$)' and
    destination_path !~ '(^|[?&])(token|access_token|refresh_token)='
  ),
  idempotency_key text not null unique,
  required boolean not null,
  preference_key public.email_preference_key,
  status public.transactional_email_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count between 0 and 6),
  provider_message_id text,
  failure_code text check (char_length(failure_code) <= 100),
  failure_message text check (char_length(failure_message) <= 500),
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  provider_accepted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactional_email_delivery_preference_shape check (
    (required and preference_key is null) or
    (not required and preference_key is not null)
  )
);

create index transactional_email_deliveries_retry_idx
on public.transactional_email_deliveries(status, next_attempt_at, created_at)
where status in ('pending', 'retry_scheduled');

create index transactional_email_deliveries_recipient_idx
on public.transactional_email_deliveries(recipient_user_id, created_at desc);

create index transactional_email_deliveries_provider_idx
on public.transactional_email_deliveries(provider_message_id)
where provider_message_id is not null;

create trigger transactional_email_deliveries_set_updated_at
before update on public.transactional_email_deliveries
for each row execute function public.set_updated_at();

create table public.transactional_email_attempts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.transactional_email_deliveries(id) on delete cascade,
  attempt_number integer not null check (attempt_number between 1 and 6),
  outcome text not null check (
    outcome in ('sending', 'provider_accepted', 'retry_scheduled', 'failed_permanent')
  ),
  provider_message_id text,
  failure_code text check (char_length(failure_code) <= 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (delivery_id, attempt_number)
);

alter table public.email_preferences enable row level security;
alter table public.transactional_email_events enable row level security;
alter table public.transactional_email_deliveries enable row level security;
alter table public.transactional_email_attempts enable row level security;

create policy "Members can read their email preferences"
on public.email_preferences for select to authenticated
using (user_id = auth.uid());

create policy "Members can create their email preferences"
on public.email_preferences for insert to authenticated
with check (user_id = auth.uid());

create policy "Members can update their email preferences"
on public.email_preferences for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Members can read their email deliveries"
on public.transactional_email_deliveries for select to authenticated
using (recipient_user_id = auth.uid());

create policy "Administrators can read email deliveries"
on public.transactional_email_deliveries for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

create policy "Administrators can read email events"
on public.transactional_email_events for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

create policy "Administrators can read email attempts"
on public.transactional_email_attempts for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

grant select on public.email_preferences to authenticated;
grant insert (user_id, preference_key, enabled) on public.email_preferences to authenticated;
grant update (enabled) on public.email_preferences to authenticated;
grant select on public.transactional_email_deliveries to authenticated;
grant select on public.transactional_email_events, public.transactional_email_attempts
to authenticated;
revoke delete on public.email_preferences from anon, authenticated;
revoke insert, update, delete on public.transactional_email_events,
  public.transactional_email_deliveries, public.transactional_email_attempts
from anon, authenticated;

create or replace function public.enqueue_transactional_email(
  target_event_type public.transactional_email_event_type,
  target_event_key text,
  target_event_metadata jsonb,
  target_occurred_at timestamptz,
  target_recipient_user_id uuid,
  target_locale text,
  target_template_key public.transactional_email_event_type,
  target_template_version text,
  target_destination_path text,
  target_idempotency_key text,
  target_required boolean,
  target_preference_key public.email_preference_key default null
)
returns setof public.transactional_email_deliveries
language plpgsql security definer set search_path = public
as $$
declare
  target_user public.users;
  stored_event public.transactional_email_events;
  stored_delivery public.transactional_email_deliveries;
  delivery_status public.transactional_email_status := 'pending';
begin
  if target_event_metadata is null or jsonb_typeof(target_event_metadata) <> 'object'
    or pg_column_size(target_event_metadata) > 16384 then
    raise exception 'Safe event metadata is required' using errcode = '23514';
  end if;

  if target_locale not in ('en', 'es')
    or target_destination_path !~ ('^/' || target_locale || '/dashboard(/|$)') then
    raise exception 'The localized portal destination is invalid' using errcode = '23514';
  end if;

  if (target_required and target_preference_key is not null)
    or (not target_required and target_preference_key is null) then
    raise exception 'The email preference contract is invalid' using errcode = '23514';
  end if;

  if target_template_key <> target_event_type then
    raise exception 'The template must match the stable event type' using errcode = '23514';
  end if;

  select * into target_user from public.users
  where id = target_recipient_user_id and not is_deleted;
  if target_user.id is null then
    raise exception 'The recipient is unavailable' using errcode = '23503';
  end if;

  if not target_required and exists (
    select 1 from public.email_preferences
    where user_id = target_recipient_user_id
      and preference_key = target_preference_key
      and not enabled
  ) then
    delivery_status := 'suppressed';
  end if;

  insert into public.transactional_email_events (
    event_type, event_key, metadata, occurred_at
  ) values (
    target_event_type, target_event_key, target_event_metadata, target_occurred_at
  ) on conflict (event_key) do nothing;

  select * into stored_event from public.transactional_email_events
  where event_key = target_event_key;
  if stored_event.event_type <> target_event_type
    or stored_event.metadata <> target_event_metadata
    or stored_event.occurred_at <> target_occurred_at then
    raise exception 'The event key already identifies a different event' using errcode = '23505';
  end if;

  insert into public.transactional_email_deliveries (
    event_id, recipient_user_id, recipient_email, recipient_name, locale,
    template_key, template_version, destination_path, idempotency_key,
    required, preference_key, status
  ) values (
    stored_event.id, target_user.id, target_user.email, target_user.full_name,
    target_locale, target_template_key, target_template_version,
    target_destination_path, target_idempotency_key, target_required,
    target_preference_key, delivery_status
  ) on conflict (idempotency_key) do nothing;

  select * into stored_delivery from public.transactional_email_deliveries
  where idempotency_key = target_idempotency_key;
  if stored_delivery.event_id <> stored_event.id
    or stored_delivery.recipient_user_id <> target_recipient_user_id
    or stored_delivery.template_key <> target_template_key then
    raise exception 'The delivery key already identifies a different recipient delivery' using errcode = '23505';
  end if;
  return next stored_delivery;
end;
$$;

create or replace function public.claim_transactional_email_deliveries(batch_size integer default 10)
returns setof public.transactional_email_deliveries
language plpgsql security definer set search_path = public
as $$
declare claimed public.transactional_email_deliveries;
begin
  if batch_size < 1 or batch_size > 50 then
    raise exception 'Batch size must be between 1 and 50' using errcode = '22023';
  end if;

  for claimed in
    select * from public.transactional_email_deliveries
    where attempt_count < 6 and (
      status = 'pending'
      or (status = 'retry_scheduled' and next_attempt_at <= now())
      or (status = 'sending' and last_attempt_at <= now() - interval '15 minutes')
    )
    order by created_at
    limit batch_size for update skip locked
  loop
    update public.transactional_email_deliveries set
      status = 'sending', attempt_count = attempt_count + 1,
      last_attempt_at = now(), next_attempt_at = null,
      provider_message_id = null, failure_code = null, failure_message = null
    where id = claimed.id returning * into claimed;

    insert into public.transactional_email_attempts (
      delivery_id, attempt_number, outcome, started_at
    ) values (claimed.id, claimed.attempt_count, 'sending', claimed.last_attempt_at)
    on conflict (delivery_id, attempt_number) do update
      set outcome = 'sending', started_at = excluded.started_at, completed_at = null,
          provider_message_id = null, failure_code = null;
    return next claimed;
  end loop;
end;
$$;

create or replace function public.record_transactional_email_result(
  target_delivery_id uuid,
  target_succeeded boolean,
  target_provider_message_id text default null,
  target_failure_code text default null,
  target_failure_message text default null,
  target_retryable boolean default false
)
returns void language plpgsql security definer set search_path = public
as $$
declare current_delivery public.transactional_email_deliveries;
declare retry_delay interval;
declare next_status public.transactional_email_status;
begin
  select * into current_delivery from public.transactional_email_deliveries
  where id = target_delivery_id for update;
  if current_delivery.id is null or current_delivery.status <> 'sending' then return; end if;

  if target_succeeded then
    next_status := 'provider_accepted';
    update public.transactional_email_deliveries set
      status = next_status,
      provider_message_id = left(target_provider_message_id, 255),
      provider_accepted_at = now(), failure_code = null, failure_message = null
    where id = target_delivery_id;
  elsif target_retryable and current_delivery.attempt_count < 6 then
    retry_delay := case current_delivery.attempt_count
      when 1 then interval '1 minute' when 2 then interval '5 minutes'
      when 3 then interval '30 minutes' when 4 then interval '2 hours'
      else interval '12 hours' end;
    next_status := 'retry_scheduled';
    update public.transactional_email_deliveries set
      status = next_status,
      failure_code = left(coalesce(target_failure_code, 'unknown_failure'), 100),
      failure_message = left(coalesce(target_failure_message, 'Email delivery failed.'), 500),
      next_attempt_at = now() + retry_delay
    where id = target_delivery_id;
  else
    next_status := 'failed_permanent';
    update public.transactional_email_deliveries set
      status = next_status,
      failure_code = left(coalesce(target_failure_code, 'unknown_failure'), 100),
      failure_message = left(coalesce(target_failure_message, 'Email delivery failed.'), 500),
      next_attempt_at = null
    where id = target_delivery_id;
  end if;

  update public.transactional_email_attempts set
    outcome = next_status::text,
    provider_message_id = left(target_provider_message_id, 255),
    failure_code = left(target_failure_code, 100), completed_at = now()
  where delivery_id = target_delivery_id
    and attempt_number = current_delivery.attempt_count;
end;
$$;

create or replace function public.record_transactional_email_webhook(
  target_provider_message_id text,
  target_event text,
  target_failure_code text default null
)
returns void language plpgsql security definer set search_path = public
as $$
declare current_delivery public.transactional_email_deliveries;
declare retry_delay interval;
begin
  select * into current_delivery from public.transactional_email_deliveries
  where provider_message_id = target_provider_message_id
  order by created_at desc limit 1 for update;
  if current_delivery.id is null then return; end if;

  if target_event = 'delivered' then
    update public.transactional_email_deliveries set status = 'delivered', delivered_at = now()
    where id = current_delivery.id and status in ('provider_accepted', 'delivered');
  elsif target_event in ('soft_bounce', 'deferred') and current_delivery.attempt_count < 6 then
    retry_delay := case current_delivery.attempt_count
      when 1 then interval '1 minute' when 2 then interval '5 minutes'
      when 3 then interval '30 minutes' when 4 then interval '2 hours'
      else interval '12 hours' end;
    update public.transactional_email_deliveries set
      status = 'retry_scheduled', failure_code = left(target_failure_code, 100),
      next_attempt_at = now() + retry_delay
    where id = current_delivery.id and status <> 'delivered';
  elsif target_event in ('hard_bounce', 'blocked', 'spam', 'invalid', 'unsubscribed') then
    update public.transactional_email_deliveries set
      status = 'failed_permanent', failure_code = left(target_failure_code, 100),
      next_attempt_at = null
    where id = current_delivery.id and status <> 'delivered';
  end if;
end;
$$;

revoke all on function public.enqueue_transactional_email(public.transactional_email_event_type,text,jsonb,timestamptz,uuid,text,public.transactional_email_event_type,text,text,text,boolean,public.email_preference_key) from public, anon, authenticated;
revoke all on function public.claim_transactional_email_deliveries(integer) from public, anon, authenticated;
revoke all on function public.record_transactional_email_result(uuid,boolean,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.record_transactional_email_webhook(text,text,text) from public, anon, authenticated;
grant execute on function public.enqueue_transactional_email(public.transactional_email_event_type,text,jsonb,timestamptz,uuid,text,public.transactional_email_event_type,text,text,text,boolean,public.email_preference_key) to service_role;
grant execute on function public.claim_transactional_email_deliveries(integer) to service_role;
grant execute on function public.record_transactional_email_result(uuid,boolean,text,text,text,boolean) to service_role;
grant execute on function public.record_transactional_email_webhook(text,text,text) to service_role;

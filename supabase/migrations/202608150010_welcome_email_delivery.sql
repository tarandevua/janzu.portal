-- TASK-103: persist the member locale and one welcome-email delivery per account.

alter table public.users
add column if not exists preferred_locale text,
add column if not exists activated_at timestamptz;

alter table public.users
drop constraint if exists users_preferred_locale_check;

alter table public.users
add constraint users_preferred_locale_check
check (preferred_locale is null or preferred_locale in ('en', 'es'));

create table public.welcome_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null default 'welcome.activated'
    check (event_type = 'welcome.activated'),
  idempotency_key text not null unique,
  recipient_email text not null,
  recipient_name text,
  locale text not null check (locale in ('en', 'es')),
  role_names public.app_role[] not null default '{}'::public.app_role[],
  template_version text not null default 'v1',
  status text not null check (
    status in (
      'sending',
      'provider_accepted',
      'retry_scheduled',
      'failed_permanent'
    )
  ),
  attempt_count integer not null default 0 check (attempt_count between 0 and 6),
  provider_message_id text,
  failure_code text,
  failure_message text check (char_length(failure_message) <= 500),
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  provider_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index welcome_email_deliveries_status_retry_idx
on public.welcome_email_deliveries(status, next_attempt_at)
where status = 'retry_scheduled';

create index welcome_email_deliveries_user_created_idx
on public.welcome_email_deliveries(user_id, created_at desc);

create trigger welcome_email_deliveries_set_updated_at
before update on public.welcome_email_deliveries
for each row execute function public.set_updated_at();

alter table public.welcome_email_deliveries enable row level security;

create policy "Members can read their own welcome delivery"
on public.welcome_email_deliveries
for select to authenticated
using (user_id = auth.uid());

create policy "Administrators can read welcome deliveries"
on public.welcome_email_deliveries
for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

revoke insert, update, delete on table public.welcome_email_deliveries
from anon, authenticated;
grant select on table public.welcome_email_deliveries to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_locale text;
begin
  metadata_locale := case
    when new.raw_user_meta_data ->> 'preferred_locale' in ('en', 'es')
      then new.raw_user_meta_data ->> 'preferred_locale'
    else null
  end;

  insert into public.users (
    id,
    email,
    full_name,
    official_full_name,
    preferred_locale
  ) values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'full_name',
    metadata_locale
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        official_full_name = coalesce(
          excluded.official_full_name,
          public.users.official_full_name
        ),
        preferred_locale = coalesce(
          public.users.preferred_locale,
          excluded.preferred_locale
        );

  insert into public.user_roles (user_id, role_id)
  select new.id, roles.id
  from public.roles
  where roles.name = 'apprentice'
  on conflict do nothing;

  return new;
end;
$$;

create or replace function public.claim_welcome_email_delivery(
  target_user_id uuid,
  target_locale text
)
returns setof public.welcome_email_deliveries
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.users;
  target_roles public.app_role[];
  current_delivery public.welcome_email_deliveries;
begin
  if target_locale not in ('en', 'es') then
    raise exception 'A supported locale is required' using errcode = '23514';
  end if;

  select * into target_user
  from public.users
  where id = target_user_id
  for update;

  if target_user.id is null or target_user.is_deleted then
    return;
  end if;

  update public.users
  set
    preferred_locale = coalesce(preferred_locale, target_locale),
    activated_at = coalesce(activated_at, now())
  where id = target_user_id
  returning * into target_user;

  select coalesce(
    array_agg(roles.name order by roles.name),
    '{}'::public.app_role[]
  ) into target_roles
  from public.user_roles
  join public.roles on roles.id = user_roles.role_id
  where user_roles.user_id = target_user_id;

  select * into current_delivery
  from public.welcome_email_deliveries
  where user_id = target_user_id
  for update;

  if current_delivery.id is null then
    insert into public.welcome_email_deliveries (
      user_id,
      idempotency_key,
      recipient_email,
      recipient_name,
      locale,
      role_names,
      status,
      attempt_count,
      last_attempt_at
    ) values (
      target_user_id,
      'welcome.activated:' || target_user_id::text || ':v1',
      target_user.email,
      target_user.full_name,
      target_user.preferred_locale,
      target_roles,
      'sending',
      1,
      now()
    )
    returning * into current_delivery;

    return next current_delivery;
    return;
  end if;

  if current_delivery.status in ('provider_accepted', 'failed_permanent')
    or current_delivery.attempt_count >= 6
    or (
      current_delivery.status = 'retry_scheduled'
      and current_delivery.next_attempt_at > now()
    )
    or (
      current_delivery.status = 'sending'
      and current_delivery.last_attempt_at > now() - interval '15 minutes'
    )
  then
    return;
  end if;

  update public.welcome_email_deliveries
  set
    recipient_email = target_user.email,
    recipient_name = target_user.full_name,
    locale = target_user.preferred_locale,
    role_names = target_roles,
    status = 'sending',
    attempt_count = attempt_count + 1,
    provider_message_id = null,
    failure_code = null,
    failure_message = null,
    last_attempt_at = now(),
    next_attempt_at = null
  where id = current_delivery.id
  returning * into current_delivery;

  return next current_delivery;
end;
$$;

create or replace function public.record_welcome_email_result(
  target_delivery_id uuid,
  target_succeeded boolean,
  target_provider_message_id text default null,
  target_failure_code text default null,
  target_failure_message text default null,
  target_retryable boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_delivery public.welcome_email_deliveries;
  retry_delay interval;
begin
  select * into current_delivery
  from public.welcome_email_deliveries
  where id = target_delivery_id
  for update;

  if current_delivery.id is null or current_delivery.status <> 'sending' then
    return;
  end if;

  if target_succeeded then
    update public.welcome_email_deliveries
    set
      status = 'provider_accepted',
      provider_message_id = left(target_provider_message_id, 255),
      provider_accepted_at = now(),
      failure_code = null,
      failure_message = null,
      next_attempt_at = null
    where id = target_delivery_id;
    return;
  end if;

  if target_retryable and current_delivery.attempt_count < 6 then
    retry_delay := case current_delivery.attempt_count
      when 1 then interval '1 minute'
      when 2 then interval '5 minutes'
      when 3 then interval '30 minutes'
      when 4 then interval '2 hours'
      else interval '12 hours'
    end;

    update public.welcome_email_deliveries
    set
      status = 'retry_scheduled',
      failure_code = left(coalesce(target_failure_code, 'unknown_failure'), 100),
      failure_message = left(coalesce(target_failure_message, 'Welcome email failed.'), 500),
      next_attempt_at = now() + retry_delay
    where id = target_delivery_id;
  else
    update public.welcome_email_deliveries
    set
      status = 'failed_permanent',
      failure_code = left(coalesce(target_failure_code, 'unknown_failure'), 100),
      failure_message = left(coalesce(target_failure_message, 'Welcome email failed.'), 500),
      next_attempt_at = null
    where id = target_delivery_id;
  end if;
end;
$$;

revoke all on function public.claim_welcome_email_delivery(uuid, text)
from public, anon, authenticated;
revoke all on function public.record_welcome_email_result(
  uuid,
  boolean,
  text,
  text,
  text,
  boolean
) from public, anon, authenticated;

grant execute on function public.claim_welcome_email_delivery(uuid, text)
to service_role;
grant execute on function public.record_welcome_email_result(
  uuid,
  boolean,
  text,
  text,
  text,
  boolean
) to service_role;

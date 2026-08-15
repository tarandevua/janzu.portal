\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '13000000-0000-4000-8000-000000000001',
    'task-103-spanish@example.test',
    '{"full_name":"Miembro Español","preferred_locale":"es"}'::jsonb
  ),
  (
    '13000000-0000-4000-8000-000000000002',
    'task-103-retry@example.test',
    '{"full_name":"Retry Member"}'::jsonb
  );

insert into public.user_roles (user_id, role_id)
select '13000000-0000-4000-8000-000000000001', roles.id
from public.roles
where roles.name = 'instructor'
on conflict do nothing;

do $$
declare
  claimed public.welcome_email_deliveries;
  duplicate_count integer;
begin
  select * into claimed
  from public.claim_welcome_email_delivery(
    '13000000-0000-4000-8000-000000000001',
    'en'
  );

  if claimed.id is null
    or claimed.locale <> 'es'
    or claimed.idempotency_key <>
      'welcome.activated:13000000-0000-4000-8000-000000000001:v1'
    or not ('instructor' = any(claimed.role_names))
    or claimed.attempt_count <> 1
  then
    raise exception 'The first welcome claim did not preserve locale, roles, or idempotency';
  end if;

  select count(*) into duplicate_count
  from public.claim_welcome_email_delivery(
    '13000000-0000-4000-8000-000000000001',
    'es'
  );

  if duplicate_count <> 0 then
    raise exception 'A concurrent activation claimed a duplicate welcome delivery';
  end if;

  perform public.record_welcome_email_result(
    claimed.id,
    true,
    'provider-message-103'
  );

  if (
    select status from public.welcome_email_deliveries where id = claimed.id
  ) <> 'provider_accepted' then
    raise exception 'Provider acceptance was not recorded';
  end if;
end;
$$;

do $$
declare
  claimed public.welcome_email_deliveries;
  retried public.welcome_email_deliveries;
begin
  select * into claimed
  from public.claim_welcome_email_delivery(
    '13000000-0000-4000-8000-000000000002',
    'en'
  );

  perform public.record_welcome_email_result(
    claimed.id,
    false,
    null,
    'email_provider_http_503',
    'The email provider temporarily rejected the request.',
    true
  );

  if (
    select status from public.welcome_email_deliveries where id = claimed.id
  ) <> 'retry_scheduled' then
    raise exception 'A retryable failure was not scheduled';
  end if;

  update public.welcome_email_deliveries
  set next_attempt_at = now() - interval '1 second'
  where id = claimed.id;

  select * into retried
  from public.claim_welcome_email_delivery(
    '13000000-0000-4000-8000-000000000002',
    'es'
  );

  if retried.id <> claimed.id
    or retried.attempt_count <> 2
    or retried.locale <> 'en'
  then
    raise exception 'Retry did not reuse the delivery or its preferred locale';
  end if;
end;
$$;

do $$
begin
  if has_function_privilege(
    'authenticated',
    'public.claim_welcome_email_delivery(uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated clients can claim welcome deliveries directly';
  end if;

  if has_function_privilege(
    'anon',
    'public.record_welcome_email_result(uuid,boolean,text,text,text,boolean)',
    'EXECUTE'
  ) then
    raise exception 'Anonymous clients can forge welcome delivery results';
  end if;
end;
$$;

rollback;

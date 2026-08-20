\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values (
  '50000000-0000-4000-8000-000000000001',
  'task-502@example.test',
  '{"full_name":"Email Member","preferred_locale":"en"}'::jsonb
), (
  '50000000-0000-4000-8000-000000000002',
  'task-502-unrelated@example.test',
  '{"full_name":"Unrelated Member","preferred_locale":"es"}'::jsonb
);

insert into public.email_preferences (user_id, preference_key, enabled)
values ('50000000-0000-4000-8000-000000000001', 'feedback_updates', false);

do $$
declare first_delivery public.transactional_email_deliveries;
declare duplicate_delivery public.transactional_email_deliveries;
begin
  select * into first_delivery from public.enqueue_transactional_email(
    'feedback.received', 'feedback.received:50000000-0000-4000-8000-000000000010',
    '{"feedback_id":"50000000-0000-4000-8000-000000000010"}'::jsonb,
    '2026-08-20T08:00:00Z', '50000000-0000-4000-8000-000000000001', 'en', 'feedback.received', 'v1',
    '/en/dashboard/feedback?feedbackId=50000000-0000-4000-8000-000000000010',
    'feedback.received:50000000-0000-4000-8000-000000000010:50000000-0000-4000-8000-000000000001',
    false, 'feedback_updates'
  );
  select * into duplicate_delivery from public.enqueue_transactional_email(
    'feedback.received', 'feedback.received:50000000-0000-4000-8000-000000000010',
    '{"feedback_id":"50000000-0000-4000-8000-000000000010"}'::jsonb,
    '2026-08-20T08:00:00Z', '50000000-0000-4000-8000-000000000001', 'en', 'feedback.received', 'v1',
    '/en/dashboard/feedback?feedbackId=50000000-0000-4000-8000-000000000010',
    'feedback.received:50000000-0000-4000-8000-000000000010:50000000-0000-4000-8000-000000000001',
    false, 'feedback_updates'
  );
  if first_delivery.id <> duplicate_delivery.id or first_delivery.status <> 'suppressed' then
    raise exception 'Optional suppression or duplicate prevention failed';
  end if;
end;
$$;

do $$
declare queued public.transactional_email_deliveries;
declare claimed public.transactional_email_deliveries;
begin
  select * into queued from public.enqueue_transactional_email(
    'role.assigned', 'role:50000000-0000-4000-8000-000000000020:assigned',
    '{"role_audit_id":"50000000-0000-4000-8000-000000000020","role_label":"Instructor"}'::jsonb,
    now(), '50000000-0000-4000-8000-000000000001', 'en', 'role.assigned', 'v1',
    '/en/dashboard',
    'role:50000000-0000-4000-8000-000000000020:assigned:50000000-0000-4000-8000-000000000001',
    true, null
  );
  select * into claimed from public.claim_transactional_email_deliveries(10)
  where id = queued.id;
  perform public.record_transactional_email_result(
    claimed.id, false, null, 'email_provider_http_503', 'Temporary provider failure.', true
  );
  if (select status from public.transactional_email_deliveries where id = claimed.id) <> 'retry_scheduled'
    or (select count(*) from public.transactional_email_attempts where delivery_id = claimed.id) <> 1 then
    raise exception 'Retry state or safe attempt record was not stored';
  end if;
end;
$$;

do $$ begin
  if has_function_privilege('authenticated', 'public.claim_transactional_email_deliveries(integer)', 'EXECUTE') then
    raise exception 'Authenticated users can claim the outbox';
  end if;
  if has_function_privilege('anon', 'public.record_transactional_email_webhook(text,text,text)', 'EXECUTE') then
    raise exception 'Anonymous users can forge provider delivery state';
  end if;
end $$;

select set_config(
  'request.jwt.claim.sub',
  '50000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;

do $$
begin
  if (select count(*) from public.email_preferences) <> 1 then
    raise exception 'A member can read another member email preferences';
  end if;

  begin
    insert into public.email_preferences (user_id, preference_key, enabled)
    values ('50000000-0000-4000-8000-000000000002', 'session_updates', false);
    raise exception 'A member can create another member email preferences';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

rollback;

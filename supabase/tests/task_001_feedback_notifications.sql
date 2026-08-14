\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'task-001-owner@example.test',
    '{"full_name":"Task Owner"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'task-001-unrelated@example.test',
    '{"full_name":"Unrelated User"}'::jsonb
  );

insert into public.practitioners (id, user_id)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002'
  );

insert into public.clients (id, practitioner_id, name, email)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'Maya',
  'maya@example.test'
);

insert into public.sessions (
  id,
  practitioner_id,
  client_id,
  session_date,
  duration_minutes
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '2026-08-14',
    60
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    null,
    '2026-08-15',
    60
  );

insert into public.session_feedback (id, session_id, token, rating)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'task-001-owner-feedback-token-000001',
    5
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'task-001-unrelated-feedback-token-02',
    5
  );

select public.submit_session_feedback(
  feedback_token => 'task-001-owner-feedback-token-000001',
  feedback_participant_email => 'maya@example.test',
  feedback_participant_preferred_language => 'en',
  feedback_rating => 5,
  feedback_experience_text => 'A calm and grounded session.',
  feedback_emotional_impact => 'I felt supported.',
  feedback_gdpr_agreed => true
);

select public.submit_session_feedback(
  feedback_token => 'task-001-unrelated-feedback-token-02',
  feedback_participant_email => 'other@example.test',
  feedback_participant_preferred_language => 'es',
  feedback_rating => 4,
  feedback_experience_text => 'Una sesión tranquila.',
  feedback_emotional_impact => 'Me sentí acompañado.',
  feedback_gdpr_agreed => true
);

do $$
declare
  created_notification public.notifications;
begin
  select *
  into created_notification
  from public.notifications
  where feedback_id = '50000000-0000-4000-8000-000000000001';

  if created_notification.id is null then
    raise exception 'Expected a feedback notification';
  end if;

  if (
    select count(*)
    from public.notifications
    where feedback_id = '50000000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'Expected exactly one notification for the feedback record';
  end if;

  if created_notification.user_id <> '10000000-0000-4000-8000-000000000001' then
    raise exception 'Notification recipient is incorrect';
  end if;

  if created_notification.participant_name <> 'Maya'
    or created_notification.feedback_session_date <> '2026-08-14'
    or created_notification.feedback_rating <> 5
    or created_notification.href <>
      '/dashboard/feedback?feedbackId=50000000-0000-4000-8000-000000000001'
  then
    raise exception 'Notification details or exact link are incorrect';
  end if;
end;
$$;

update public.session_feedback
set submitted_at = submitted_at
where id = '50000000-0000-4000-8000-000000000001';

do $$
begin
  if (
    select count(*)
    from public.notifications
    where feedback_id = '50000000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'A submitted feedback update created a duplicate notification';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);

do $$
declare
  visible_count integer;
  spoof_was_denied boolean := false;
begin
  select count(*)
  into visible_count
  from public.list_feedback_dashboard(
    '10000000-0000-4000-8000-000000000001',
    null,
    1,
    10,
    '50000000-0000-4000-8000-000000000001'
  );

  if visible_count <> 1 then
    raise exception 'The owner could not open the exact feedback link';
  end if;

  begin
    perform *
    from public.list_feedback_dashboard(
      '10000000-0000-4000-8000-000000000002',
      null,
      1,
      10,
      '50000000-0000-4000-8000-000000000002'
    );
  exception
    when insufficient_privilege then
      spoof_was_denied := true;
  end;

  if not spoof_was_denied then
    raise exception 'The RPC accepted a spoofed actor user ID';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

do $$
begin
  if (
    select count(*)
    from public.list_feedback_dashboard(
      '10000000-0000-4000-8000-000000000002',
      null,
      1,
      10,
      '50000000-0000-4000-8000-000000000001'
    )
  ) <> 0 then
    raise exception 'An unrelated user could open another user''s feedback';
  end if;
end;
$$;

rollback;

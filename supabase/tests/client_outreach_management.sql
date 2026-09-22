\set ON_ERROR_STOP on

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('19022000-0000-4000-8000-000000000001', 'outreach-owner@example.test', '{"full_name":"Outreach Owner"}'::jsonb),
  ('19022000-0000-4000-8000-000000000002', 'outreach-other@example.test', '{"full_name":"Outreach Other"}'::jsonb);
insert into public.users (id, email, full_name) values
  ('19022000-0000-4000-8000-000000000001', 'outreach-owner@example.test', 'Outreach Owner'),
  ('19022000-0000-4000-8000-000000000002', 'outreach-other@example.test', 'Outreach Other')
on conflict (id) do update set full_name = excluded.full_name;
insert into public.practitioners (id, user_id) values
  ('29022000-0000-4000-8000-000000000001', '19022000-0000-4000-8000-000000000001'),
  ('29022000-0000-4000-8000-000000000002', '19022000-0000-4000-8000-000000000002');
insert into public.clients (id, practitioner_id, name, lifecycle_status) values
  ('39022000-0000-4000-8000-000000000001', '29022000-0000-4000-8000-000000000001', 'Prospect One', 'prospect');

set local role authenticated;
select set_config('request.jwt.claim.sub', '19022000-0000-4000-8000-000000000001', true);

select public.create_client_outreach_record(
  '39022000-0000-4000-8000-000000000001', '2026-09-20', 'email', null,
  true, 'needs_time', null, 'Initial offer', '2026-09-24'
);
select public.create_client_outreach_record(
  '39022000-0000-4000-8000-000000000001', '2026-09-22', 'whatsapp', null,
  true, 'interested', null, 'Positive reply', '2026-09-30'
);

do $$
begin
  if (select count(*) from public.client_outreach_records where follow_up_status = 'open') <> 1 then
    raise exception 'Expected exactly one open follow-up';
  end if;
  if (select count(*) from public.client_outreach_records where follow_up_status = 'completed') <> 1 then
    raise exception 'Previous follow-up was not completed atomically';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '19022000-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (select 1 from public.client_outreach_records) then
    raise exception 'Another practitioner could read private outreach';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '19022000-0000-4000-8000-000000000001', true);
insert into public.sessions (practitioner_id, client_id, session_date, duration_minutes)
values ('29022000-0000-4000-8000-000000000001', '39022000-0000-4000-8000-000000000001', '2026-10-01', 60);

do $$
begin
  if (select lifecycle_status from public.clients where id = '39022000-0000-4000-8000-000000000001') <> 'active' then
    raise exception 'Logging a session did not activate the prospect';
  end if;
end;
$$;

rollback;

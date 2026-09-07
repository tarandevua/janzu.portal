-- TASK-601 / DEC-04: private historical claims. Recognition never grants roles.
create table public.historical_member_claims (
  id uuid primary key default gen_random_uuid(),
  member_user_id uuid not null references public.users(id) on delete restrict,
  source text not null check (length(source) between 1 and 160),
  source_key text not null check (length(source_key) between 1 and 160),
  kind text not null check (kind in ('training','sessions','facilitator','instructor')),
  import_payload jsonb not null,
  details jsonb not null,
  status text not null default 'pending_information' check (status in ('pending_information','awaiting_admin','approved','partially_approved','rejected','disputed')),
  revision integer not null default 1,
  reviewer_user_id uuid references public.users(id) on delete restrict,
  senior_decision text,
  senior_total integer,
  approved_total integer not null default 0 check (approved_total between 0 and 100000),
  decided_by uuid references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source, source_key),
  check (reviewer_user_id is distinct from member_user_id),
  check (decided_by is distinct from member_user_id),
  check (decided_by is null or decided_by is distinct from reviewer_user_id),
  check (status not in ('approved','partially_approved') or (reviewer_user_id is not null and decided_by is not null and senior_decision in ('approved','partially_approved')))
);
create index historical_claim_member_idx on public.historical_member_claims(member_user_id, updated_at desc);
create index historical_claim_reviewer_idx on public.historical_member_claims(reviewer_user_id, status);
create table public.historical_member_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.historical_member_claims(id) on delete restrict,
  revision integer not null,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  reason text not null check (length(reason) between 1 and 1000),
  snapshot jsonb not null,
  occurred_at timestamptz not null default now()
);
create index historical_events_claim_idx on public.historical_member_events(claim_id, occurred_at, id);
alter table public.historical_member_claims enable row level security;
alter table public.historical_member_events enable row level security;
revoke all on public.historical_member_claims, public.historical_member_events from anon, authenticated;
-- import_payload includes the identity-match email, never exposed in the read model.
grant select (id, member_user_id, source, source_key, kind, details, status, revision,
  reviewer_user_id, senior_decision, senior_total, approved_total, decided_by, created_at, updated_at)
  on public.historical_member_claims to authenticated;
grant select on public.historical_member_events to authenticated;
create policy historical_claim_read on public.historical_member_claims for select to authenticated using (
  exists(select 1 from public.users where id=auth.uid() and not is_deleted) and (
  member_user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin')
  or (reviewer_user_id = auth.uid() and public.user_has_role(auth.uid(), 'instructor')))
);
create policy historical_event_read on public.historical_member_events for select to authenticated using (
  exists(select 1 from public.historical_member_claims c where c.id = claim_id)
);

create function public.task_601_assert_actor(actor_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not exists(select 1 from public.users where id = actor_user_id and not is_deleted) then
    raise exception 'Historical access denied' using errcode = '42501';
  end if;
end;
$$;

-- Validate also at the database boundary: direct RPC calls cannot bypass the server schema.
create function public.task_601_validate_details(kind text, d jsonb) returns boolean
language plpgsql set search_path = public as $$
declare item jsonb; key text;
begin
  if d is null or jsonb_typeof(d) <> 'object' or pg_column_size(d) > 24000 then return false; end if;
  for key in select jsonb_object_keys(d) loop
    if key not in ('period','location','teachingInstructor','cohort','identityEvidence','declaration','evidence',
      'level','startedOn','completedOn','courseworkComplete','attendanceComplete','priorEligibilityEvidence',
      'coveredFrom','cutoff','claimedTotal','calculationMethod','historicalRecognitionEvidence') then return false; end if;
    if key not in ('evidence','claimedTotal','courseworkComplete','attendanceComplete')
      and (jsonb_typeof(d->key) <> 'string' or length(d->>key) > 1000) then return false; end if;
  end loop;
  if coalesce(length(trim(d->>'period')),0) = 0 or coalesce(length(trim(d->>'location')),0) = 0
    or coalesce(length(trim(d->>'teachingInstructor')),0) = 0
    or length(coalesce(d->>'cohort','')) > 160
    or jsonb_typeof(d->'evidence') is distinct from 'array' or jsonb_array_length(d->'evidence') > 10 then return false; end if;
  for item in select value from jsonb_array_elements(d->'evidence') loop
    if jsonb_typeof(item) <> 'object' or coalesce(item->>'type','') not in ('primary','corroborating')
      or coalesce(length(trim(item->>'reference')),0) not between 1 and 1000
      or coalesce(length(trim(item->>'source')),0) not between 1 and 1000
      or exists(select 1 from jsonb_object_keys(item) k where k not in ('type','reference','source')) then return false; end if;
  end loop;
  foreach key in array array['startedOn','completedOn','coveredFrom','cutoff'] loop
    if d ? key and ((d->>key) !~ '^\d{4}-\d{2}-\d{2}$' or (d->>key)::date > current_date) then return false; end if;
  end loop;
  foreach key in array array['courseworkComplete','attendanceComplete'] loop
    if d ? key and jsonb_typeof(d->key) <> 'boolean' then return false; end if;
  end loop;
  if kind = 'training' and coalesce(d->>'level','') not in ('level_1','level_2') then return false; end if;
  if d ? 'startedOn' and d ? 'completedOn' and (d->>'startedOn')::date > (d->>'completedOn')::date then return false; end if;
  if kind = 'sessions' then
    if not (d ?& array['coveredFrom','cutoff','claimedTotal','calculationMethod'])
      or (d->>'coveredFrom')::date > (d->>'cutoff')::date
      or jsonb_typeof(d->'claimedTotal') <> 'number' or (d->>'claimedTotal') !~ '^\d+$'
      or (d->>'claimedTotal')::integer not between 0 and 100000
      or coalesce(length(trim(d->>'calculationMethod')),0) = 0 then return false; end if;
  end if;
  return true;
exception when others then return false;
end;
$$;

create function public.task_601_audit(c public.historical_member_claims, actor uuid, action text, reason text)
returns void language sql security definer set search_path = public as $$
  insert into public.historical_member_events(claim_id, revision, actor_user_id, action, reason, snapshot)
  values(c.id, c.revision, actor, action, reason, to_jsonb(c) - 'import_payload');
$$;

create function public.import_historical_members(actor_user_id uuid, import_rows jsonb, commit_import boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare row_data jsonb; report jsonb := '[]'; code text; n integer := 0;
  existing public.historical_member_claims; c public.historical_member_claims; matched uuid; matches integer;
begin
  perform public.task_601_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id,'admin') then raise exception 'Administrator required' using errcode = '42501'; end if;
  if jsonb_typeof(import_rows) is distinct from 'array' or jsonb_array_length(import_rows) not between 1 and 100
    or pg_column_size(import_rows) > 1000000 or commit_import is null then raise exception 'Invalid import' using errcode = '22023'; end if;
  -- Serialize commit/review source identities. Dry runs deliberately acquire no write locks and write nothing.
  if commit_import then
    perform pg_advisory_xact_lock(601, 1);
    -- Keep identity matching stable through mutation, including case-variant account inserts.
    lock table public.users in share mode;
  end if;
  for row_data in select value from jsonb_array_elements(import_rows) loop
    code := 'ready'; matched := null; existing := null; n := n + 1;
    begin
      if jsonb_typeof(row_data) <> 'object'
        or jsonb_typeof(row_data->'source') is distinct from 'string'
        or jsonb_typeof(row_data->'key') is distinct from 'string'
        or jsonb_typeof(row_data->'memberId') is distinct from 'string'
        or jsonb_typeof(row_data->'email') is distinct from 'string'
        or jsonb_typeof(row_data->'kind') is distinct from 'string'
        or exists(select 1 from jsonb_object_keys(row_data) k where k not in ('source','key','memberId','email','kind','details'))
        or coalesce(length(trim(row_data->>'source')),0) not between 1 and 160
        or coalesce(length(trim(row_data->>'key')),0) not between 1 and 160
        or coalesce(length(row_data->>'email'),0) not between 3 and 254
        or coalesce(row_data->>'kind','') not in ('training','sessions','facilitator','instructor')
        or not public.task_601_validate_details(row_data->>'kind', row_data->'details') then
        code := 'invalid';
      else
        select count(*), (array_agg(id))[1] into matches, matched from public.users
          where lower(trim(email)) = lower(trim(row_data->>'email')) and not is_deleted;
        if matches > 1 then code := 'duplicate_identity';
        elsif matches <> 1 or matched is distinct from (row_data->>'memberId')::uuid then code := 'identity_mismatch'; end if;
        if (select count(*) from jsonb_array_elements(import_rows) r where
          lower(trim(r->>'email')) = lower(trim(row_data->>'email')) or r->>'memberId' = row_data->>'memberId') > 1 then code := 'duplicate_identity'; end if;
        select * into existing from public.historical_member_claims where source = row_data->>'source' and source_key = row_data->>'key';
        if existing.id is not null and code = 'ready' then
          code := case when existing.import_payload = row_data then 'replay' else 'source_conflict' end;
        end if;
        if (select count(*) from jsonb_array_elements(import_rows) r where r->>'source' = row_data->>'source' and r->>'key' = row_data->>'key') > 1 then code := 'source_conflict'; end if;
      end if;
    exception when invalid_text_representation then code := 'invalid'; end;
    report := report || jsonb_build_array(jsonb_build_object('index',n,'code',code));
  end loop;
  if not commit_import or exists(select 1 from jsonb_array_elements(report) r where r->>'code' not in ('ready','replay')) then
    return jsonb_build_object('committed',false,'rows',report);
  end if;
  report := '[]'; n := 0;
  -- All rows were checked before the first mutation. The transaction is all-or-nothing.
  for row_data in select value from jsonb_array_elements(import_rows) loop
    n := n + 1;
    select * into c from public.historical_member_claims where source = row_data->>'source' and source_key = row_data->>'key';
    code := 'replay';
    if c.id is null then
      insert into public.historical_member_claims(member_user_id,source,source_key,kind,import_payload,details)
      values((row_data->>'memberId')::uuid,row_data->>'source',row_data->>'key',row_data->>'kind',row_data,row_data->'details') returning * into c;
      perform public.task_601_audit(c,actor_user_id,'imported',case when (select preferred_locale from public.users where id=c.member_user_id)='es' then 'Importada para verificación; no se ha activado ningún estado de confianza.' else 'Imported for verification; no trusted status activated.' end);
      code := 'ready';
    end if;
    report := report || jsonb_build_array(jsonb_build_object('index',n,'code',code,'claimId',c.id));
  end loop;
  return jsonb_build_object('committed',true,'rows',report);
end;
$$;

-- Link canonical training without allowing the ordinary one-reviewer workflow to approve historical claims.
alter table public.training_history add column historical_claim_id uuid unique references public.historical_member_claims(id) on delete restrict;
create function public.task_601_guard_training() returns trigger language plpgsql set search_path = public as $$
begin
  if (new.historical_claim_id is not null or (tg_op = 'UPDATE' and old.historical_claim_id is not null))
    and current_user <> (select pg_get_userbyid(relowner) from pg_class where oid = 'public.training_history'::regclass) then
    raise exception 'Historical training requires two-person review' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger historical_training_write_guard before insert or update on public.training_history for each row execute function public.task_601_guard_training();
alter function public.review_training_record(uuid,uuid,boolean,text) rename to review_nonhistorical_training_record;
revoke all on function public.review_nonhistorical_training_record(uuid,uuid,boolean,text) from public,anon,authenticated;
create function public.review_training_record(actor_user_id uuid,target_record_id uuid,approve_record boolean,review_reason text default null)
returns public.training_history language plpgsql security definer set search_path = public as $$
begin
  perform public.task_601_assert_actor(actor_user_id);
  if exists(select 1 from public.training_history where id = target_record_id and historical_claim_id is not null) then
    raise exception 'Historical training requires two-person review' using errcode = '42501';
  end if;
  return public.review_nonhistorical_training_record(actor_user_id,target_record_id,approve_record,review_reason);
end;
$$;

create function public.task_601_sync(c public.historical_member_claims, actor uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid; d jsonb := c.details;
begin
  if c.kind = 'training' then
    if c.status = 'approved' then
      insert into public.training_history(trainee_user_id,level,cohort,location,started_on,completed_on,
        teaching_instructor_name,coursework_complete,evidence_reference,status,verified_by,verified_at,historical_claim_id)
      values(c.member_user_id,(d->>'level')::public.training_level,d->>'cohort',d->>'location',
        (d->>'startedOn')::date,(d->>'completedOn')::date,d->>'teachingInstructor',true,
        'Historical claim ' || c.id::text,'verified',c.decided_by,now(),c.id)
      on conflict(historical_claim_id) do update set level=excluded.level, cohort=excluded.cohort,location=excluded.location,
        started_on=excluded.started_on,completed_on=excluded.completed_on,teaching_instructor_name=excluded.teaching_instructor_name,
        coursework_complete=true,status='verified',verified_by=excluded.verified_by,verified_at=excluded.verified_at,rejection_reason=null;
    else
      update public.training_history set status='rejected', rejection_reason=case when (select preferred_locale from public.users where id=c.member_user_id)='es' then 'La declaración histórica requiere revisión.' else 'Historical claim requires review.' end where historical_claim_id=c.id;
    end if;
  end if;
  select id into pid from public.practitioners where user_id=c.member_user_id;
  if pid is not null then perform public.recalculate_certification_journey(pid,actor); end if;
end;
$$;

create function public.act_on_historical_claim(actor_user_id uuid, command jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c public.historical_member_claims; action text := command->>'action'; decision text := command->>'decision';
  reason text := trim(command->>'reason'); reviewer uuid; total integer; d jsonb; is_admin boolean; is_reviewer boolean;
begin
  perform public.task_601_assert_actor(actor_user_id);
  perform pg_advisory_xact_lock(601, 1);
  select * into c from public.historical_member_claims where id=(command->>'id')::uuid for update;
  is_admin := public.user_has_role(actor_user_id,'admin');
  is_reviewer := c.reviewer_user_id=actor_user_id and public.user_has_role(actor_user_id,'instructor');
  if c.id is null or not (is_admin or coalesce(is_reviewer,false) or c.member_user_id=actor_user_id) then
    raise exception 'Historical access denied' using errcode='42501'; end if;
  if (command->>'revision')::integer is distinct from c.revision or coalesce(length(reason),0) not between 1 and 1000 then
    raise exception 'Stale revision or missing reason' using errcode='23514'; end if;
  if action='assign' then
    reviewer := (command->>'reviewerId')::uuid;
    if not is_admin or actor_user_id=c.member_user_id or reviewer=c.member_user_id or reviewer=actor_user_id
      or not public.user_has_role(reviewer,'instructor')
      or not exists(select 1 from public.users where id=reviewer and not is_deleted) then
      raise exception 'Independent designated Instructor required' using errcode='42501'; end if;
    -- An appeal uses different reviewers where staffing permits, enforced against durable decision history.
    if exists(select 1 from public.historical_member_events e where e.claim_id=c.id and e.action='senior_review' and e.actor_user_id=reviewer)
      and exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id join public.users u on u.id=ur.user_id
        where r.name='instructor' and not u.is_deleted and ur.user_id not in (c.member_user_id,actor_user_id,reviewer)) then
      raise exception 'Select a different reviewer for the appeal' using errcode='23514'; end if;
    update public.historical_member_claims set reviewer_user_id=reviewer, senior_decision=null,senior_total=null,
      decided_by=null,approved_total=0,status='pending_information' where id=c.id;
  elsif action='recuse' then
    if not coalesce(is_reviewer,false) then raise exception 'Only the designated reviewer may recuse' using errcode='42501'; end if;
    update public.historical_member_claims set reviewer_user_id=null,senior_decision=null,senior_total=null,
      decided_by=null,approved_total=0,status='pending_information' where id=c.id;
  elsif action='revise' then
    if not (c.member_user_id=actor_user_id or is_admin) then raise exception 'Only the member or Administrator may revise' using errcode='42501'; end if;
    if not public.task_601_validate_details(c.kind,command->'details') then raise exception 'Invalid claim details' using errcode='23514'; end if;
    update public.historical_member_claims set details=command->'details',reviewer_user_id=null,senior_decision=null,
      senior_total=null,decided_by=null,approved_total=0,status='pending_information' where id=c.id;
  elsif action='review' then
    if actor_user_id=c.member_user_id or command->'noConflict' is distinct from 'true'::jsonb then
      raise exception 'Independent review and conflict declaration required' using errcode='42501'; end if;
    if coalesce(decision,'') not in ('approved','partially_approved','pending_information','rejected','disputed') then
      raise exception 'Invalid decision' using errcode='23514'; end if;
    total := (command->>'approvedTotal')::integer; d:=c.details;
    if total is null or total not between 0 and 100000 or (c.kind <> 'sessions' and total <> 0)
      or (c.kind='sessions' and total > (d->>'claimedTotal')::integer)
      or (decision='approved' and c.kind='sessions' and total<>(d->>'claimedTotal')::integer)
      or (decision not in ('approved','partially_approved') and total<>0)
      or (decision='partially_approved' and (c.kind<>'sessions' or total=0 or total >= (d->>'claimedTotal')::integer)) then
      raise exception 'Invalid supported total' using errcode='23514'; end if;
    if decision in ('approved','partially_approved') then
      if coalesce(length(trim(d->>'identityEvidence')),0)=0 or coalesce(length(trim(d->>'declaration')),0)=0
        or not (exists(select 1 from jsonb_array_elements(d->'evidence') e where e->>'type'='primary')
          or (select count(distinct lower(trim(e->>'source'))) from jsonb_array_elements(d->'evidence') e where e->>'type'='corroborating') >= 2) then
        raise exception 'Identity, declaration and independent evidence required' using errcode='23514'; end if;
      if c.kind='training' and (not (d ?& array['startedOn','completedOn'])
        or coalesce(d->>'cohort','')='' or length(d->>'location')>240 or length(d->>'teachingInstructor')>160
        or d->'courseworkComplete' is distinct from 'true'::jsonb or d->'attendanceComplete' is distinct from 'true'::jsonb
        or (d->>'level'='level_2' and coalesce(length(trim(d->>'priorEligibilityEvidence')),0)=0)) then
        raise exception 'Complete verified training and prior eligibility required' using errcode='23514'; end if;
      if c.kind in ('facilitator','instructor') and coalesce(length(trim(d->>'historicalRecognitionEvidence')),0)=0 then
        raise exception 'Historical professional recognition evidence required' using errcode='23514'; end if;
      if c.kind='sessions' and not exists(select 1 from public.training_history t where t.trainee_user_id=c.member_user_id
        and t.level='level_1' and t.status='verified' and t.coursework_complete and t.completed_on < (d->>'coveredFrom')::date) then
        raise exception 'Session range must follow verified Level 1' using errcode='23514'; end if;
      if c.kind='sessions' and exists(select 1 from public.historical_member_claims other where other.id<>c.id
        and other.member_user_id=c.member_user_id and other.kind='sessions' and other.status in ('approved','partially_approved')
        and daterange((other.details->>'coveredFrom')::date,(other.details->>'cutoff')::date,'[]') && daterange((d->>'coveredFrom')::date,(d->>'cutoff')::date,'[]')) then
        raise exception 'Overlapping historical totals require correction' using errcode='23514'; end if;
      if c.kind<>'sessions' and exists(select 1 from public.historical_member_claims other where other.id<>c.id
        and other.member_user_id=c.member_user_id and other.kind=c.kind and other.status='approved'
        and (c.kind<>'training' or other.details->>'level'=d->>'level')) then
        raise exception 'Duplicate historical recognition requires correction' using errcode='23514'; end if;
    end if;
    if coalesce(is_reviewer,false) and c.status='pending_information' then
      update public.historical_member_claims set senior_decision=decision,senior_total=total,status='awaiting_admin' where id=c.id;
      action:='senior_review';
    elsif is_admin and c.status='awaiting_admin' and actor_user_id is distinct from c.reviewer_user_id
      and public.user_has_role(c.reviewer_user_id,'instructor')
      and exists(select 1 from public.users where id=c.reviewer_user_id and not is_deleted) then
      if decision in ('approved','partially_approved') and (c.senior_decision not in ('approved','partially_approved') or total>c.senior_total
        or (decision='approved' and c.senior_decision='partially_approved')) then
        raise exception 'Administrator cannot exceed the evidence review' using errcode='23514'; end if;
      if exists(select 1 from public.historical_member_events e where e.claim_id=c.id and e.action='admin_review' and e.actor_user_id=act_on_historical_claim.actor_user_id)
        and exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id join public.users u on u.id=ur.user_id
          where r.name='admin' and not u.is_deleted and ur.user_id not in (actor_user_id,c.member_user_id,c.reviewer_user_id)) then
        raise exception 'Another Administrator must review the appeal' using errcode='23514'; end if;
      update public.historical_member_claims set decided_by=actor_user_id,status=decision,approved_total=total where id=c.id;
      action:='admin_review';
    else raise exception 'Review is not authorized in this state' using errcode='42501'; end if;
  else raise exception 'Invalid action' using errcode='22023'; end if;
  update public.historical_member_claims set revision=revision+1,updated_at=now() where id=c.id returning * into c;
  perform public.task_601_audit(c,actor_user_id,action,reason);
  perform public.task_601_sync(c,actor_user_id);
  if action='admin_review' then
    perform public.insert_notification(c.member_user_id,'historical_claim_updated',
      case when (select preferred_locale from public.users where id=c.member_user_id)='es' then 'Revisión de trayectoria histórica' else 'Historical claim reviewed' end,
      case when (select preferred_locale from public.users where id=c.member_user_id)='es' then 'Abre tu declaración privada para consultar la decisión y el siguiente paso.' else 'Open your private claim for the decision and next action.' end,
      '/dashboard/historical-members?claimId=' || c.id::text);
  end if;
  return to_jsonb(c) - 'import_payload';
end;
$$;

-- Count approved aggregates once. Native sessions within an approved covered period
-- are excluded; this also prevents later entry of an old session from duplicating credit.
create function public.task_601_count_sessions(pid uuid, completed date) returns integer
language sql security definer set search_path = public stable as $$
  with historical as (
    select c.* from public.historical_member_claims c join public.practitioners p on p.user_id=c.member_user_id
    where p.id=pid and c.kind='sessions' and c.status in ('approved','partially_approved')
      and (c.details->>'coveredFrom')::date > completed
  )
  select (coalesce((select sum(approved_total) from historical),0) +
    (select count(*) from public.sessions s where s.practitioner_id=pid and s.is_validated and s.duration_minutes>=60
      and s.session_date>completed and not exists(select 1 from historical h
        where s.session_date between (h.details->>'coveredFrom')::date and (h.details->>'cutoff')::date)))::integer;
$$;

revoke all on function public.task_601_assert_actor(uuid), public.task_601_validate_details(text,jsonb),
  public.task_601_audit(public.historical_member_claims,uuid,text,text), public.task_601_sync(public.historical_member_claims,uuid),
  public.task_601_count_sessions(uuid,date), public.task_601_guard_training() from public,anon,authenticated;
revoke all on function public.import_historical_members(uuid,jsonb,boolean),public.act_on_historical_claim(uuid,jsonb),
  public.review_training_record(uuid,uuid,boolean,text) from public,anon;
grant execute on function public.import_historical_members(uuid,jsonb,boolean),public.act_on_historical_claim(uuid,jsonb),
  public.review_training_record(uuid,uuid,boolean,text) to authenticated;

-- Preserve TASK-404 transitions and notification idempotency; extend only the source count.
create or replace function public.recalculate_certification_journey(
  target_practitioner_id uuid,
  transition_actor_user_id uuid default null
)
returns public.certification_journeys
language plpgsql security definer set search_path = public
as $$
declare
  target_trainee_user_id uuid;
  level_1_record public.training_history;
  level_2_record public.training_history;
  active_assignment public.supervision_assignments;
  journey public.certification_journeys;
  desired_state public.certification_journey_state := 'level_1_in_progress';
  desired_rank integer := 1;
  current_rank integer;
  next_rank integer;
  qualifying_count integer := 0;
  level_2_readiness_approved boolean := false;
  assessment_readiness_approved boolean := false;
  previous_state public.certification_journey_state;
  previous_count integer;
begin
  select user_id into target_trainee_user_id from public.practitioners where id = target_practitioner_id;
  if target_trainee_user_id is null then raise exception 'Certification journey target was not found' using errcode = 'P0002'; end if;

  select * into level_1_record from public.training_history
  where trainee_user_id = target_trainee_user_id and level = 'level_1'
    and status = 'verified' and coursework_complete = true
  order by completed_on, verified_at, id limit 1;

  if level_1_record.id is not null then
    qualifying_count := public.task_601_count_sessions(target_practitioner_id, level_1_record.completed_on);
    select * into active_assignment from public.supervision_assignments
    where trainee_user_id = target_trainee_user_id and status = 'active' limit 1;
    desired_state := 'practicum_in_progress'; desired_rank := 3;
    if qualifying_count >= 25 then desired_state := 'sessions_25_reached'; desired_rank := 4; end if;
    if qualifying_count >= 25 and active_assignment.id is not null then desired_state := 'level_2_review_eligible'; desired_rank := 5; end if;

    select exists (select 1 from public.level_2_readiness_requests
      where journey_id = (select id from public.certification_journeys where practitioner_id = target_practitioner_id)
        and assignment_id = active_assignment.id and status = 'approved') into level_2_readiness_approved;
    select * into level_2_record from public.training_history
    where trainee_user_id = target_trainee_user_id and level = 'level_2'
      and status = 'verified' and coursework_complete = true and completed_on >= level_1_record.completed_on
    order by completed_on, verified_at, id limit 1;
    if level_2_record.id is not null and qualifying_count >= 25 and active_assignment.id is not null and level_2_readiness_approved then
      desired_state := 'advanced_practicum_in_progress'; desired_rank := 7;
    end if;
    if level_2_record.id is not null and qualifying_count >= 50 and active_assignment.id is not null and level_2_readiness_approved then
      desired_state := 'sessions_50_reached'; desired_rank := 8;
    end if;
    select exists (select 1 from public.assessment_readiness_requests
      where journey_id = (select id from public.certification_journeys where practitioner_id = target_practitioner_id)
        and assignment_id = active_assignment.id and status = 'approved') into assessment_readiness_approved;
    if desired_rank = 8 and assessment_readiness_approved then desired_state := 'assessment_available'; desired_rank := 9; end if;
  end if;

  insert into public.certification_journeys (trainee_user_id, practitioner_id, counted_sessions_count,
    level_1_training_record_id, level_2_training_record_id)
  values (target_trainee_user_id, target_practitioner_id, qualifying_count, level_1_record.id, level_2_record.id)
  on conflict (practitioner_id) do nothing;
  select * into journey from public.certification_journeys where practitioner_id = target_practitioner_id for update;
  previous_state := journey.state; previous_count := journey.counted_sessions_count;
  current_rank := public.certification_journey_state_rank(journey.state);
  update public.certification_journeys set counted_sessions_count = qualifying_count,
    level_1_training_record_id = level_1_record.id, level_2_training_record_id = level_2_record.id
  where id = journey.id returning * into journey;

  if qualifying_count < 25 or level_1_record.id is null or active_assignment.id is null then
    perform public.invalidate_level_2_readiness(journey.id, transition_actor_user_id);
  end if;
  if qualifying_count < 50 or level_2_record.id is null or active_assignment.id is null then
    perform public.invalidate_assessment_readiness(journey.id, transition_actor_user_id);
  end if;
  if current_rank <= 9 then
    if desired_rank < current_rank then
      update public.certification_journeys set state = desired_state, state_changed_at = now() where id = journey.id returning * into journey;
      insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
        resulting_state, previous_counted_sessions, resulting_counted_sessions, reason)
      values (journey.id, transition_actor_user_id, 'eligibility_recalculated', previous_state,
        desired_state, previous_count, qualifying_count, 'Source eligibility changed.');
    elsif desired_rank > current_rank then
      for next_rank in current_rank + 1..desired_rank loop
        insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
          resulting_state, previous_counted_sessions, resulting_counted_sessions, reason)
        values (journey.id, transition_actor_user_id, 'automatic_transition',
          public.certification_journey_state_at_rank(next_rank - 1), public.certification_journey_state_at_rank(next_rank),
          previous_count, qualifying_count, 'Rule-driven transition from verified source records.')
        on conflict (journey_id, resulting_state) where action = 'automatic_transition' do nothing;
      end loop;
      update public.certification_journeys set state = desired_state, state_changed_at = now() where id = journey.id returning * into journey;
    end if;
  end if;
  perform public.emit_25_session_milestone(journey);
  perform public.emit_50_session_milestone(journey);
  return journey;
end;
$$;


-- Add the historical source link to the existing authorized training read model.
drop function public.list_training_history(uuid, uuid);
create or replace function public.list_training_history(
  actor_user_id uuid,
  target_trainee_user_id uuid
)
returns table (
  id uuid,
  trainee_user_id uuid,
  level public.training_level,
  cohort text,
  location text,
  started_on date,
  completed_on date,
  teaching_instructor_name text,
  coursework_complete boolean,
  evidence_reference text,
  notes text,
  status public.training_record_status,
  verified_by uuid,
  verified_by_name text,
  verified_under_assignment_id uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz,
  historical_claim_id uuid
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Training history access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not (
    target_trainee_user_id = actor_user_id
    or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, target_trainee_user_id)
  ) then
    raise exception 'Training history access is not authorized'
      using errcode = '42501';
  end if;

  return query
  select
    training.id,
    training.trainee_user_id,
    training.level,
    training.cohort,
    training.location,
    training.started_on,
    training.completed_on,
    training.teaching_instructor_name,
    training.coursework_complete,
    training.evidence_reference,
    training.notes,
    training.status,
    training.verified_by,
    case
      when training.verified_by is null then null
      else coalesce(nullif(verifier.full_name, ''), 'Janzu reviewer')
    end,
    training.verified_under_assignment_id,
    training.verified_at,
    training.rejection_reason,
    training.created_at,
    training.updated_at,
    training.historical_claim_id
  from public.training_history as training
  left join public.users as verifier on verifier.id = training.verified_by
  where training.trainee_user_id = target_trainee_user_id
  order by training.created_at desc;
end;
$$;

revoke all on function public.list_training_history(uuid, uuid) from public, anon;
grant execute on function public.list_training_history(uuid, uuid) to authenticated;

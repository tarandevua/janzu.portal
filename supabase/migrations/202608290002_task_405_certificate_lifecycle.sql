-- TASK-405: issue immutable digital certificates and atomically activate the
-- certification-derived Facilitator role. Certificate artifacts and signature
-- assets remain private; public verification exposes a minimal projection.

create type public.certificate_status as enum ('active', 'replaced', 'revoked');
create type public.certificate_replacement_request_status as enum ('pending', 'approved', 'rejected');
create type public.certificate_appeal_status as enum ('pending', 'upheld', 'reinstated');
create type public.certification_lifecycle_status as enum ('pending', 'active', 'revoked');

alter table public.certification_journeys
add column certification_status public.certification_lifecycle_status not null default 'pending';

create table public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  issuer_name text not null,
  signatory_one_name text not null,
  signatory_one_object_path text,
  signatory_one_sha256 text,
  signatory_two_name text not null,
  signatory_two_object_path text,
  signatory_two_sha256 text,
  active boolean not null default false,
  production_ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_template_signature_shape check (
    not production_ready or (
      signatory_one_object_path is not null and signatory_two_object_path is not null
      and signatory_one_sha256 ~ '^[0-9a-f]{64}$'
      and signatory_two_sha256 ~ '^[0-9a-f]{64}$'
      and signatory_one_object_path ~ '^certificate-signatures/[A-Za-z0-9._/-]+[.]png$'
      and signatory_two_object_path ~ '^certificate-signatures/[A-Za-z0-9._/-]+[.]png$'
    )
  )
);

create unique index certificate_templates_one_active_idx
on public.certificate_templates(active) where active;

create trigger certificate_templates_set_updated_at before update on public.certificate_templates
for each row execute function public.set_updated_at();

insert into public.certificate_templates (
  version, issuer_name, signatory_one_name, signatory_two_name, active, production_ready
) values ('v1', 'Escuela de Artes Acuáticas', 'Maria Ornelas', 'Iván Gonzáles', true, false);

create table public.certificates (
  id uuid primary key,
  journey_id uuid not null references public.certification_journeys(id) on delete restrict,
  assessment_id uuid references public.assessments(id) on delete restrict,
  member_user_id uuid not null references public.users(id) on delete restrict,
  certificate_number text not null unique,
  status public.certificate_status not null default 'active',
  practitioner_stage text not null default 'practitioner' check (practitioner_stage = 'practitioner'),
  official_name_snapshot text not null,
  issuer_name_snapshot text not null,
  signatory_one_name_snapshot text not null,
  signatory_one_sha256 text not null check (signatory_one_sha256 ~ '^[0-9a-f]{64}$'),
  signatory_two_name_snapshot text not null,
  signatory_two_sha256 text not null check (signatory_two_sha256 ~ '^[0-9a-f]{64}$'),
  template_id uuid not null references public.certificate_templates(id) on delete restrict,
  template_version text not null,
  original_certification_date date not null,
  issued_at timestamptz not null,
  lifecycle_effective_at timestamptz not null,
  predecessor_certificate_id uuid references public.certificates(id) on delete restrict,
  replaced_by_certificate_id uuid references public.certificates(id) on delete restrict,
  revoked_at timestamptz,
  revoked_by uuid references public.users(id) on delete restrict,
  revocation_reason text,
  revocation_evidence_reference text,
  artifact_object_path text not null,
  artifact_sha256 text not null check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  artifact_size_bytes integer not null check (artifact_size_bytes > 0 and artifact_size_bytes <= 10485760),
  generated_at timestamptz not null,
  issued_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint certificate_number_format check (certificate_number ~ '^JZ-[0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  constraint certificate_name_length check (char_length(trim(official_name_snapshot)) between 2 and 200),
  constraint certificate_artifact_path check (artifact_object_path ~ '^certificates/[0-9a-f-]{36}/[0-9a-f-]{36}[.]pdf$'),
  constraint certificate_replacement_links check (
    predecessor_certificate_id is null or predecessor_certificate_id <> id
  ),
  constraint certificate_revocation_shape check (
    (status <> 'revoked' and revoked_at is null and revoked_by is null and revocation_reason is null and revocation_evidence_reference is null)
    or
    (status = 'revoked' and revoked_at is not null and revoked_by is not null
      and char_length(trim(coalesce(revocation_reason, ''))) between 10 and 1000
      and char_length(trim(coalesce(revocation_evidence_reference, ''))) between 3 and 1000)
  )
);

create unique index certificates_one_active_per_member_idx
on public.certificates(member_user_id) where status = 'active';
create index certificates_member_history_idx on public.certificates(member_user_id, issued_at desc, id);
create index certificates_journey_idx on public.certificates(journey_id, issued_at desc);
create index certificates_predecessor_idx on public.certificates(predecessor_certificate_id)
where predecessor_certificate_id is not null;

alter table public.certification_journeys
add column current_certificate_id uuid references public.certificates(id) on delete restrict;

alter table public.user_roles
add column source_certificate_id uuid references public.certificates(id) on delete restrict;
create index user_roles_source_certificate_idx on public.user_roles(source_certificate_id)
where source_certificate_id is not null;

create table public.certificate_lifecycle_audit (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete restrict,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null check (action in (
    'issued', 'replaced', 'revoked', 'reinstated', 'member_downloaded', 'administrator_downloaded'
  )),
  previous_status public.certificate_status,
  resulting_status public.certificate_status not null,
  reason text,
  evidence_reference text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint certificate_audit_reason_length check (char_length(coalesce(reason, '')) <= 1000),
  constraint certificate_audit_evidence_length check (char_length(coalesce(evidence_reference, '')) <= 1000),
  constraint certificate_audit_metadata_shape check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192)
);
create index certificate_lifecycle_audit_certificate_idx
on public.certificate_lifecycle_audit(certificate_id, occurred_at, id);

create table public.certificate_replacement_requests (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete restrict,
  member_user_id uuid not null references public.users(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 10 and 1000),
  status public.certificate_replacement_request_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_by uuid references public.users(id) on delete restrict,
  decided_at timestamptz,
  decision_reason text,
  replacement_certificate_id uuid references public.certificates(id) on delete restrict,
  constraint certificate_replacement_decision_shape check (
    (status = 'pending' and decided_by is null and decided_at is null and decision_reason is null and replacement_certificate_id is null)
    or
    (status = 'approved' and decided_by is not null and decided_at is not null and replacement_certificate_id is not null)
    or
    (status = 'rejected' and decided_by is not null and decided_at is not null
      and char_length(trim(coalesce(decision_reason, ''))) between 10 and 1000
      and replacement_certificate_id is null)
  )
);
create unique index certificate_replacement_one_pending_idx
on public.certificate_replacement_requests(certificate_id) where status = 'pending';
create index certificate_replacement_member_idx
on public.certificate_replacement_requests(member_user_id, requested_at desc);

create table public.certificate_appeals (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete restrict,
  member_user_id uuid not null references public.users(id) on delete restrict,
  appeal_reason text not null check (char_length(trim(appeal_reason)) between 10 and 2000),
  evidence_reference text check (char_length(coalesce(evidence_reference, '')) <= 1000),
  status public.certificate_appeal_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  decided_by uuid references public.users(id) on delete restrict,
  decided_at timestamptz,
  decision_reason text,
  reinstatement_certificate_id uuid references public.certificates(id) on delete restrict,
  constraint certificate_appeal_decision_shape check (
    (status = 'pending' and decided_by is null and decided_at is null and decision_reason is null and reinstatement_certificate_id is null)
    or
    (status = 'upheld' and decided_by is not null and decided_at is not null
      and char_length(trim(coalesce(decision_reason, ''))) between 10 and 2000
      and reinstatement_certificate_id is null)
    or
    (status = 'reinstated' and decided_by is not null and decided_at is not null
      and char_length(trim(coalesce(decision_reason, ''))) between 10 and 2000
      and reinstatement_certificate_id is not null)
  )
);
create unique index certificate_appeals_one_pending_idx
on public.certificate_appeals(certificate_id) where status = 'pending';
create index certificate_appeals_member_idx on public.certificate_appeals(member_user_id, submitted_at desc);

alter table public.certificate_templates enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_lifecycle_audit enable row level security;
alter table public.certificate_replacement_requests enable row level security;
alter table public.certificate_appeals enable row level security;

revoke all on public.certificate_templates, public.certificates, public.certificate_lifecycle_audit,
  public.certificate_replacement_requests, public.certificate_appeals from anon, authenticated;

create or replace function public.task_405_assert_actor(actor_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Certificate actions are limited to the authenticated user' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.task_405_validate_artifact(
  target_member_user_id uuid,
  target_certificate_id uuid,
  target_certificate_number text,
  target_template_id uuid,
  target_artifact_object_path text,
  target_artifact_sha256 text,
  target_artifact_size_bytes integer,
  target_signatory_one_sha256 text,
  target_signatory_two_sha256 text
)
returns public.certificate_templates language plpgsql security definer set search_path = public
as $$
declare template public.certificate_templates;
begin
  select * into template from public.certificate_templates
  where id = target_template_id and active and production_ready for share;
  if template.id is null then
    raise exception 'The production certificate template is not configured' using errcode = '55000';
  end if;
  if target_certificate_number !~ '^JZ-[0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$' then
    raise exception 'Certificate number format is invalid' using errcode = '23514';
  end if;
  if target_artifact_object_path <> 'certificates/' || target_member_user_id::text || '/' || target_certificate_id::text || '.pdf'
    or target_artifact_sha256 !~ '^[0-9a-f]{64}$'
    or target_artifact_size_bytes <= 0 or target_artifact_size_bytes > 10485760 then
    raise exception 'Certificate artifact metadata is invalid' using errcode = '23514';
  end if;
  if target_signatory_one_sha256 is distinct from template.signatory_one_sha256
    or target_signatory_two_sha256 is distinct from template.signatory_two_sha256 then
    raise exception 'Certificate signature checksums do not match the approved template' using errcode = '23514';
  end if;
  return template;
end;
$$;

create or replace function public.task_405_deliver(
  recipient_user_id uuid,
  target_event_type public.transactional_email_event_type,
  target_notification_type public.notification_type,
  target_event_key text,
  target_title_en text,
  target_title_es text,
  target_body_en text,
  target_body_es text,
  target_href text,
  target_metadata jsonb,
  send_email boolean default true,
  email_required boolean default true,
  email_preference public.email_preference_key default null,
  target_occurred_at timestamptz default now()
)
returns void language plpgsql security definer set search_path = public
as $$
declare recipient_locale text;
begin
  if recipient_user_id is null then return; end if;
  select case when preferred_locale = 'es' then 'es' else 'en' end into recipient_locale
  from public.users where id = recipient_user_id;
  insert into public.notifications (user_id, type, title, body, href, event_key)
  values (recipient_user_id, target_notification_type,
    case when recipient_locale = 'es' then target_title_es else target_title_en end,
    case when recipient_locale = 'es' then target_body_es else target_body_en end,
    target_href, target_event_key || ':' || recipient_user_id::text)
  on conflict (event_key) where event_key is not null do nothing;
  if send_email then
    perform public.enqueue_transactional_email(
      target_event_type, target_event_key, target_metadata, target_occurred_at,
      recipient_user_id, recipient_locale, target_event_type, 'v1',
      '/' || recipient_locale || target_href,
      target_event_key || ':' || recipient_user_id::text, email_required,
      case when email_required then null else email_preference end
    );
  end if;
end;
$$;

create or replace function public.get_certificate_generation_context(
  actor_user_id uuid,
  target_operation text,
  target_journey_id uuid default null,
  target_certificate_id uuid default null,
  target_appeal_id uuid default null
)
returns table (
  operation text, journey_id uuid, assessment_id uuid, member_user_id uuid,
  official_name text, original_certification_date date, predecessor_certificate_id uuid,
  template_id uuid, template_version text, issuer_name text,
  signatory_one_name text, signatory_one_object_path text, signatory_one_sha256 text,
  signatory_two_name text, signatory_two_object_path text, signatory_two_sha256 text,
  template_ready boolean
)
language plpgsql security definer set search_path = public
as $$
declare journey public.certification_journeys;
declare certificate public.certificates;
declare appeal public.certificate_appeals;
declare template public.certificate_templates;
declare passed_assessment public.assessments;
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then
    raise exception 'Only an Administrator can prepare a certificate' using errcode = '42501';
  end if;
  if target_operation not in ('issue', 'replace', 'reinstate') then
    raise exception 'Unsupported certificate operation' using errcode = '22023';
  end if;
  select * into template from public.certificate_templates where active limit 1;
  if template.id is null then raise exception 'No active certificate template exists' using errcode = '55000'; end if;

  if target_operation = 'issue' then
    select * into journey from public.certification_journeys where id = target_journey_id;
    if journey.id is null or journey.state <> 'assessment_passed' or journey.certification_status <> 'pending'
      or exists (select 1 from public.certificates where member_user_id = journey.trainee_user_id and status = 'active') then
      raise exception 'The journey is not ready for certificate issuance' using errcode = '23514';
    end if;
    select * into passed_assessment from public.assessments
    where assessments.journey_id = journey.id and status = 'passed'
    order by assessed_at desc, id desc limit 1;
  elsif target_operation = 'replace' then
    select * into certificate from public.certificates where id = target_certificate_id and status = 'active';
    if certificate.id is null then raise exception 'Only an active certificate can be replaced' using errcode = '23514'; end if;
    select * into journey from public.certification_journeys where id = certificate.journey_id;
    select * into passed_assessment from public.assessments where id = certificate.assessment_id;
  else
    select * into appeal from public.certificate_appeals where id = target_appeal_id and status = 'pending';
    if appeal.id is null then raise exception 'The appeal is not pending' using errcode = '23514'; end if;
    select * into certificate from public.certificates where id = appeal.certificate_id and status = 'revoked';
    select * into journey from public.certification_journeys where id = certificate.journey_id;
    select * into passed_assessment from public.assessments where id = certificate.assessment_id;
    if certificate.revoked_by = actor_user_id and exists (
      select 1 from public.user_roles join public.roles on roles.id = user_roles.role_id
      where roles.name = 'admin' and user_roles.user_id <> actor_user_id
    ) then raise exception 'Another Administrator must decide this appeal' using errcode = '42501'; end if;
  end if;
  if journey.id is null or passed_assessment.id is null then
    raise exception 'A passed assessment is required' using errcode = '23514';
  end if;
  return query select target_operation, journey.id, passed_assessment.id, journey.trainee_user_id,
    nullif(trim(users.official_full_name), ''),
    coalesce(certificate.original_certification_date, current_date), certificate.id,
    template.id, template.version, template.issuer_name,
    template.signatory_one_name, template.signatory_one_object_path, template.signatory_one_sha256,
    template.signatory_two_name, template.signatory_two_object_path, template.signatory_two_sha256,
    template.production_ready
  from public.users where users.id = journey.trainee_user_id;
end;
$$;

create or replace function public.issue_certificate(
  actor_user_id uuid, target_certificate_id uuid, target_journey_id uuid,
  target_certificate_number text, target_template_id uuid,
  target_artifact_object_path text, target_artifact_sha256 text, target_artifact_size_bytes integer,
  target_signatory_one_sha256 text, target_signatory_two_sha256 text
)
returns public.certificates language plpgsql security definer set search_path = public
as $$
declare journey public.certification_journeys;
declare assessment public.assessments;
declare member public.users;
declare template public.certificate_templates;
declare certificate public.certificates;
declare facilitator_role_id uuid;
declare role_row_id uuid;
declare role_created boolean := false;
declare recipient record;
declare event_time timestamptz := now();
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may issue certification' using errcode = '42501'; end if;
  select * into journey from public.certification_journeys where id = target_journey_id for update;
  if journey.id is null then raise exception 'Certification journey was not found' using errcode = 'P0002'; end if;
  if exists (select 1 from public.certificates where id = target_certificate_id) then
    select * into certificate from public.certificates where id = target_certificate_id;
    if certificate.journey_id = journey.id and certificate.status = 'active' then return certificate; end if;
    raise exception 'Certificate identifier is already in use' using errcode = '23505';
  end if;
  journey := public.recalculate_certification_journey(journey.practitioner_id, actor_user_id);
  if journey.state <> 'assessment_passed' or journey.certification_status <> 'pending'
    or journey.counted_sessions_count < 50 or journey.level_2_training_record_id is null
    or not exists (select 1 from public.supervision_assignments where trainee_user_id = journey.trainee_user_id and status = 'active')
    or exists (select 1 from public.certificates where member_user_id = journey.trainee_user_id and status = 'active') then
    raise exception 'Certification requirements are no longer satisfied' using errcode = '23514';
  end if;
  select * into assessment from public.assessments where journey_id = journey.id and status = 'passed'
  order by assessed_at desc, id desc limit 1;
  if assessment.id is null then raise exception 'An authorized passed assessment is required' using errcode = '23514'; end if;
  select * into member from public.users where id = journey.trainee_user_id;
  if char_length(trim(coalesce(member.official_full_name, ''))) < 2 then raise exception 'An official full name is required' using errcode = '23514'; end if;
  template := public.task_405_validate_artifact(journey.trainee_user_id, target_certificate_id,
    target_certificate_number, target_template_id, target_artifact_object_path, target_artifact_sha256,
    target_artifact_size_bytes, target_signatory_one_sha256, target_signatory_two_sha256);

  insert into public.certificates (
    id, journey_id, assessment_id, member_user_id, certificate_number, official_name_snapshot,
    issuer_name_snapshot, signatory_one_name_snapshot, signatory_one_sha256,
    signatory_two_name_snapshot, signatory_two_sha256, template_id, template_version,
    original_certification_date, issued_at, lifecycle_effective_at, artifact_object_path,
    artifact_sha256, artifact_size_bytes, generated_at, issued_by
  ) values (
    target_certificate_id, journey.id, assessment.id, journey.trainee_user_id, target_certificate_number,
    trim(member.official_full_name), template.issuer_name, template.signatory_one_name, template.signatory_one_sha256,
    template.signatory_two_name, template.signatory_two_sha256, template.id, template.version,
    event_time::date, event_time, event_time, target_artifact_object_path,
    target_artifact_sha256, target_artifact_size_bytes, event_time, actor_user_id
  ) returning * into certificate;

  update public.certification_journeys set state = 'certification_approved', state_changed_at = event_time
  where id = journey.id;
  insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
    resulting_state, previous_counted_sessions, resulting_counted_sessions, reason, metadata)
  values (journey.id, actor_user_id, 'automatic_transition', 'assessment_passed', 'certification_approved',
    journey.counted_sessions_count, journey.counted_sessions_count, 'Authorized final certification approval.',
    jsonb_build_object('certificateId', certificate.id, 'assessmentId', assessment.id));

  select id into facilitator_role_id from public.roles where name = 'facilitator';
  insert into public.user_roles (user_id, role_id, assigned_by, source_certificate_id)
  values (journey.trainee_user_id, facilitator_role_id, actor_user_id, certificate.id)
  on conflict (user_id, role_id) do nothing returning id into role_row_id;
  role_created := role_row_id is not null;

  update public.certification_journeys set state = 'facilitator_activated', state_changed_at = event_time,
    certification_status = 'active', current_certificate_id = certificate.id where id = journey.id;
  insert into public.certification_journey_audit (journey_id, actor_user_id, action, previous_state,
    resulting_state, previous_counted_sessions, resulting_counted_sessions, reason, metadata)
  values (journey.id, actor_user_id, 'automatic_transition', 'certification_approved', 'facilitator_activated',
    journey.counted_sessions_count, journey.counted_sessions_count, 'Certificate issuance activated Facilitator access.',
    jsonb_build_object('certificateId', certificate.id, 'roleCreatedByCertificate', role_created));
  update public.certification_progress set status = 'approved', approved_by = actor_user_id,
    approved_at = event_time, updated_at = event_time where practitioner_id = journey.practitioner_id;
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, resulting_status, metadata)
  values (certificate.id, actor_user_id, 'issued', 'active',
    jsonb_build_object('journeyId', journey.id, 'assessmentId', assessment.id, 'roleCreatedByCertificate', role_created));

  perform public.task_405_deliver(journey.trainee_user_id, 'certification.approved', 'certification_approved',
    'certification:' || certificate.id::text || ':approved', 'Certification approved', 'Certificación aprobada',
    'Your passed assessment was verified and final certification was approved.',
    'Tu evaluación aprobada fue verificada y se aprobó la certificación final.',
    '/dashboard/certification?decisionId=' || certificate.id::text,
    jsonb_build_object('journeyId', journey.id, 'decisionId', certificate.id, 'memberUserId', journey.trainee_user_id,
      'resultingState', 'approved', 'effectiveTimestamp', event_time, 'decidingRoleLabel', 'Administrator', 'nextAction', 'view_certification'));
  perform public.task_405_deliver(journey.trainee_user_id, 'certificate.issued', 'certificate_issued',
    'certificate:' || certificate.id::text || ':issued', 'Digital certificate issued', 'Certificado digital emitido',
    'Your bilingual certificate is ready to download in the Certification section.',
    'Tu certificado bilingüe está listo para descargar en la sección de Certificación.',
    '/dashboard/certification?certificateId=' || certificate.id::text,
    jsonb_build_object('certificateId', certificate.id, 'memberUserId', journey.trainee_user_id,
      'certificateNumber', certificate.certificate_number, 'status', 'issued', 'issuedAt', event_time, 'locale', 'member'));
  if role_created then
    perform public.task_405_deliver(journey.trainee_user_id, 'role.assigned', 'role_assigned',
      'role:' || certificate.id::text || ':assigned', 'Facilitator access activated', 'Acceso de Facilitador activado',
      'Certification activated your verified Facilitator access without changing profile visibility.',
      'La certificación activó tu acceso verificado de Facilitador sin cambiar la visibilidad del perfil.',
      '/dashboard', jsonb_build_object('roleAuditId', certificate.id, 'targetUserId', journey.trainee_user_id,
        'roleLabel', 'Facilitator', 'action', 'assigned', 'effectiveTimestamp', event_time, 'actorRoleLabel', 'Administrator'));
  end if;
  for recipient in
    select user_roles.user_id from public.user_roles join public.roles on roles.id = user_roles.role_id
      where roles.name = 'admin' and user_roles.user_id <> actor_user_id
    union select assignments.instructor_user_id from public.supervision_assignments assignments
      where assignments.trainee_user_id = journey.trainee_user_id and assignments.status = 'active'
    union select assessment.assessor_user_id where assessment.assessor_user_id is not null and assessment.assessor_user_id <> actor_user_id
  loop
    perform public.task_405_deliver(recipient.user_id, 'certification.approved', 'certification_approved',
      'certification:' || certificate.id::text || ':approved', 'Certification approved', 'Certificación aprobada',
      'Final certification was approved. Private details remain in the portal.',
      'Se aprobó la certificación final. Los detalles privados permanecen en el portal.',
      '/dashboard/certification?decisionId=' || certificate.id::text,
      jsonb_build_object('journeyId', journey.id, 'decisionId', certificate.id, 'memberUserId', journey.trainee_user_id,
        'resultingState', 'approved', 'effectiveTimestamp', event_time, 'decidingRoleLabel', 'Administrator', 'nextAction', 'view_certification'),
      true, false, 'certification_decisions');
  end loop;
  return certificate;
end;
$$;

create or replace function public.replace_certificate(
  actor_user_id uuid, target_certificate_id uuid, target_predecessor_certificate_id uuid,
  replacement_reason text, target_replacement_request_id uuid,
  target_certificate_number text, target_template_id uuid,
  target_artifact_object_path text, target_artifact_sha256 text, target_artifact_size_bytes integer,
  target_signatory_one_sha256 text, target_signatory_two_sha256 text
)
returns public.certificates language plpgsql security definer set search_path = public
as $$
declare predecessor public.certificates;
declare member public.users;
declare template public.certificate_templates;
declare certificate public.certificates;
declare request public.certificate_replacement_requests;
declare event_time timestamptz := now();
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may replace a certificate' using errcode = '42501'; end if;
  if char_length(trim(coalesce(replacement_reason, ''))) < 10 then raise exception 'A replacement reason is required' using errcode = '23514'; end if;
  select * into predecessor from public.certificates where id = target_predecessor_certificate_id for update;
  if predecessor.id is null or predecessor.status <> 'active' then raise exception 'Only an active certificate can be replaced' using errcode = '23514'; end if;
  if exists (select 1 from public.certificates where id = target_certificate_id) then
    select * into certificate from public.certificates where id = target_certificate_id;
    if certificate.predecessor_certificate_id = predecessor.id and certificate.status = 'active' then return certificate; end if;
    raise exception 'Certificate identifier is already in use' using errcode = '23505';
  end if;
  select * into member from public.users where id = predecessor.member_user_id;
  if char_length(trim(coalesce(member.official_full_name, ''))) < 2 then raise exception 'An official full name is required' using errcode = '23514'; end if;
  template := public.task_405_validate_artifact(predecessor.member_user_id, target_certificate_id,
    target_certificate_number, target_template_id, target_artifact_object_path, target_artifact_sha256,
    target_artifact_size_bytes, target_signatory_one_sha256, target_signatory_two_sha256);
  if target_replacement_request_id is not null then
    select * into request from public.certificate_replacement_requests where id = target_replacement_request_id for update;
    if request.id is null or request.certificate_id <> predecessor.id or request.status <> 'pending' then
      raise exception 'The replacement request is not pending for this certificate' using errcode = '23514';
    end if;
  end if;
  -- Release the one-active-certificate slot inside this transaction. A later
  -- failure rolls this update back with the attempted replacement.
  update public.certificates set status = 'replaced', lifecycle_effective_at = event_time
  where id = predecessor.id;
  insert into public.certificates (
    id, journey_id, assessment_id, member_user_id, certificate_number, official_name_snapshot,
    issuer_name_snapshot, signatory_one_name_snapshot, signatory_one_sha256,
    signatory_two_name_snapshot, signatory_two_sha256, template_id, template_version,
    original_certification_date, issued_at, lifecycle_effective_at, predecessor_certificate_id,
    artifact_object_path, artifact_sha256, artifact_size_bytes, generated_at, issued_by
  ) values (
    target_certificate_id, predecessor.journey_id, predecessor.assessment_id, predecessor.member_user_id,
    target_certificate_number, trim(member.official_full_name), template.issuer_name, template.signatory_one_name,
    template.signatory_one_sha256, template.signatory_two_name, template.signatory_two_sha256, template.id,
    template.version, predecessor.original_certification_date, event_time, event_time, predecessor.id,
    target_artifact_object_path, target_artifact_sha256, target_artifact_size_bytes, event_time, actor_user_id
  ) returning * into certificate;
  update public.certificates set replaced_by_certificate_id = certificate.id where id = predecessor.id;
  update public.certification_journeys set current_certificate_id = certificate.id where id = predecessor.journey_id;
  update public.user_roles set source_certificate_id = certificate.id where source_certificate_id = predecessor.id;
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, previous_status, resulting_status, reason,
    metadata) values (predecessor.id, actor_user_id, 'replaced', 'active', 'replaced', trim(replacement_reason),
      jsonb_build_object('replacementCertificateId', certificate.id));
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, resulting_status, reason,
    metadata) values (certificate.id, actor_user_id, 'issued', 'active', trim(replacement_reason),
      jsonb_build_object('predecessorCertificateId', predecessor.id));
  if request.id is not null then
    update public.certificate_replacement_requests set status = 'approved', decided_by = actor_user_id,
      decided_at = event_time, replacement_certificate_id = certificate.id where id = request.id;
  end if;
  perform public.task_405_deliver(certificate.member_user_id, 'certificate.replaced', 'certificate_replaced',
    'certificate:' || certificate.id::text || ':replaced', 'Certificate replaced', 'Certificado reemplazado',
    'A replacement certificate is ready. Your certification and Facilitator access remain active.',
    'Un certificado de reemplazo está listo. Tu certificación y acceso de Facilitador siguen activos.',
    '/dashboard/certification?certificateId=' || certificate.id::text,
    jsonb_build_object('certificateId', certificate.id, 'memberUserId', certificate.member_user_id,
      'certificateNumber', certificate.certificate_number, 'status', 'replaced', 'issuedAt', event_time,
      'replacementPredecessorId', predecessor.id, 'locale', 'member'));
  return certificate;
end;
$$;

create or replace function public.revoke_certificate(
  actor_user_id uuid, target_certificate_id uuid, target_reason text, target_evidence_reference text
)
returns public.certificates language plpgsql security definer set search_path = public
as $$
declare certificate public.certificates;
declare journey public.certification_journeys;
declare role_removed boolean := false;
declare event_time timestamptz := now();
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may revoke a certificate' using errcode = '42501'; end if;
  if char_length(trim(coalesce(target_reason, ''))) < 10 or char_length(trim(coalesce(target_evidence_reference, ''))) < 3 then
    raise exception 'A revocation reason and evidence reference are required' using errcode = '23514';
  end if;
  select * into certificate from public.certificates where id = target_certificate_id for update;
  if certificate.id is null then raise exception 'Certificate was not found' using errcode = 'P0002'; end if;
  if certificate.status = 'revoked' then return certificate; end if;
  if certificate.status <> 'active' then raise exception 'Only an active certificate may be revoked' using errcode = '23514'; end if;
  update public.certificates set status = 'revoked', lifecycle_effective_at = event_time,
    revoked_at = event_time, revoked_by = actor_user_id, revocation_reason = trim(target_reason),
    revocation_evidence_reference = trim(target_evidence_reference)
  where id = certificate.id returning * into certificate;
  select * into journey from public.certification_journeys where id = certificate.journey_id for update;
  update public.certification_journeys set certification_status = 'revoked', current_certificate_id = certificate.id
  where id = journey.id;
  delete from public.user_roles where source_certificate_id = certificate.id returning true into role_removed;
  update public.certification_progress set status = case when validated_sessions_count >= required_sessions_count
      then 'eligible'::public.certification_status else 'in_progress'::public.certification_status end,
    approved_by = null, approved_at = null, updated_at = event_time where practitioner_id = journey.practitioner_id;
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, previous_status,
    resulting_status, reason, evidence_reference, metadata)
  values (certificate.id, actor_user_id, 'revoked', 'active', 'revoked', trim(target_reason),
    trim(target_evidence_reference), jsonb_build_object('roleRemoved', coalesce(role_removed, false)));
  perform public.task_405_deliver(certificate.member_user_id, 'certificate.revoked', 'certificate_revoked',
    'certificate:' || certificate.id::text || ':revoked', 'Certificate revoked', 'Certificado revocado',
    'Your certificate is no longer valid. Review the private lifecycle record to understand and appeal this decision.',
    'Tu certificado ya no es válido. Revisa el registro privado del ciclo de vida para conocer y apelar esta decisión.',
    '/dashboard/certification?certificateId=' || certificate.id::text,
    jsonb_build_object('certificateId', certificate.id, 'memberUserId', certificate.member_user_id,
      'certificateNumber', certificate.certificate_number, 'status', 'revoked', 'effectiveTimestamp', event_time, 'locale', 'member'));
  perform public.task_405_deliver(certificate.member_user_id, 'certification.revoked', 'certificate_revoked',
    'certification:' || certificate.id::text || ':revoked', 'Certification revoked', 'Certificación revocada',
    'Certification-derived access was removed. You may submit an appeal in the portal.',
    'Se eliminó el acceso derivado de la certificación. Puedes presentar una apelación en el portal.',
    '/dashboard/certification?decisionId=' || certificate.id::text,
    jsonb_build_object('journeyId', journey.id, 'decisionId', certificate.id, 'memberUserId', certificate.member_user_id,
      'resultingState', 'revoked', 'effectiveTimestamp', event_time, 'decidingRoleLabel', 'Administrator', 'nextAction', 'submit_appeal'));
  if coalesce(role_removed, false) then
    perform public.task_405_deliver(certificate.member_user_id, 'role.removed', 'role_removed',
      'role:' || certificate.id::text || ':removed', 'Facilitator access removed', 'Acceso de Facilitador eliminado',
      'Certification-derived Facilitator access was removed. Saved profile visibility preferences were not changed.',
      'Se eliminó el acceso de Facilitador derivado de la certificación. Las preferencias de visibilidad guardadas no cambiaron.',
      '/dashboard', jsonb_build_object('roleAuditId', certificate.id, 'targetUserId', certificate.member_user_id,
        'roleLabel', 'Facilitator', 'action', 'removed', 'effectiveTimestamp', event_time, 'actorRoleLabel', 'Administrator'));
  end if;
  return certificate;
end;
$$;

create or replace function public.request_certificate_replacement(
  actor_user_id uuid, target_certificate_id uuid, target_reason text
)
returns public.certificate_replacement_requests language plpgsql security definer set search_path = public
as $$
declare certificate public.certificates;
declare request public.certificate_replacement_requests;
declare administrator_id uuid;
declare event_key text;
begin
  perform public.task_405_assert_actor(actor_user_id);
  if char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'A replacement reason is required' using errcode = '23514'; end if;
  select * into certificate from public.certificates where id = target_certificate_id;
  if certificate.id is null or certificate.member_user_id <> actor_user_id or certificate.status <> 'active' then
    raise exception 'Only the owner may request replacement of an active certificate' using errcode = '42501';
  end if;
  insert into public.certificate_replacement_requests (certificate_id, member_user_id, reason)
  values (certificate.id, actor_user_id, trim(target_reason))
  on conflict (certificate_id) where status = 'pending' do update set reason = excluded.reason
  returning * into request;
  event_key := 'certificate-replacement-request:' || request.id::text;
  for administrator_id in select user_roles.user_id from public.user_roles
    join public.roles on roles.id = user_roles.role_id where roles.name = 'admin'
  loop
    insert into public.notifications (user_id, type, title, body, href, event_key)
    values (administrator_id, 'certificate_replacement_requested', 'Certificate replacement requested',
      'Review the private replacement request in the Certification section.',
      '/dashboard/certification?certificateId=' || certificate.id::text,
      event_key || ':' || administrator_id::text)
    on conflict (event_key) where event_key is not null do nothing;
  end loop;
  return request;
end;
$$;

create or replace function public.reject_certificate_replacement_request(
  actor_user_id uuid, target_request_id uuid, target_reason text
)
returns public.certificate_replacement_requests language plpgsql security definer set search_path = public
as $$
declare request public.certificate_replacement_requests;
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may decide replacement requests' using errcode = '42501'; end if;
  if char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'A rejection reason is required' using errcode = '23514'; end if;
  select * into request from public.certificate_replacement_requests where id = target_request_id for update;
  if request.id is null or request.status <> 'pending' then raise exception 'The replacement request is not pending' using errcode = '23514'; end if;
  update public.certificate_replacement_requests set status = 'rejected', decided_by = actor_user_id,
    decided_at = now(), decision_reason = trim(target_reason) where id = request.id returning * into request;
  insert into public.notifications (user_id, type, title, body, href, event_key)
  values (request.member_user_id, 'certificate_replacement_decided', 'Certificate replacement request decided',
    'Your replacement request was not approved. Review the private decision in the Certification section.',
    '/dashboard/certification?certificateId=' || request.certificate_id::text,
    'certificate-replacement-request:' || request.id::text || ':rejected:' || request.member_user_id::text)
  on conflict (event_key) where event_key is not null do nothing;
  return request;
end;
$$;

create or replace function public.submit_certificate_appeal(
  actor_user_id uuid, target_certificate_id uuid, target_reason text, target_evidence_reference text default null
)
returns public.certificate_appeals language plpgsql security definer set search_path = public
as $$
declare certificate public.certificates;
declare appeal public.certificate_appeals;
declare administrator_id uuid;
begin
  perform public.task_405_assert_actor(actor_user_id);
  if char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'An appeal reason is required' using errcode = '23514'; end if;
  select * into certificate from public.certificates where id = target_certificate_id;
  if certificate.id is null or certificate.member_user_id <> actor_user_id or certificate.status <> 'revoked' then
    raise exception 'Only the owner may appeal a revoked certificate' using errcode = '42501';
  end if;
  insert into public.certificate_appeals (certificate_id, member_user_id, appeal_reason, evidence_reference)
  values (certificate.id, actor_user_id, trim(target_reason), nullif(trim(coalesce(target_evidence_reference, '')), ''))
  returning * into appeal;
  for administrator_id in select user_roles.user_id from public.user_roles
    join public.roles on roles.id = user_roles.role_id where roles.name = 'admin'
  loop
    insert into public.notifications (user_id, type, title, body, href, event_key)
    values (administrator_id, 'certificate_appeal_submitted', 'Certificate appeal submitted',
      'A private certificate appeal is ready for review.', '/dashboard/certification?certificateId=' || certificate.id::text,
      'certificate-appeal:' || appeal.id::text || ':submitted:' || administrator_id::text)
    on conflict (event_key) where event_key is not null do nothing;
  end loop;
  return appeal;
end;
$$;

create or replace function public.uphold_certificate_appeal(
  actor_user_id uuid, target_appeal_id uuid, target_reason text
)
returns public.certificate_appeals language plpgsql security definer set search_path = public
as $$
declare appeal public.certificate_appeals;
declare certificate public.certificates;
declare event_time timestamptz := now();
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may decide an appeal' using errcode = '42501'; end if;
  if char_length(trim(coalesce(target_reason, ''))) < 10 then raise exception 'An appeal decision reason is required' using errcode = '23514'; end if;
  select * into appeal from public.certificate_appeals where id = target_appeal_id for update;
  select * into certificate from public.certificates where id = appeal.certificate_id;
  if appeal.id is null or appeal.status <> 'pending' then raise exception 'The appeal is not pending' using errcode = '23514'; end if;
  if certificate.revoked_by = actor_user_id and exists (
    select 1 from public.user_roles join public.roles on roles.id = user_roles.role_id
    where roles.name = 'admin' and user_roles.user_id <> actor_user_id
  ) then raise exception 'Another Administrator must decide this appeal' using errcode = '42501'; end if;
  update public.certificate_appeals set status = 'upheld', decided_by = actor_user_id,
    decided_at = event_time, decision_reason = trim(target_reason) where id = appeal.id returning * into appeal;
  perform public.task_405_deliver(appeal.member_user_id, 'certification.revoked', 'certificate_appeal_decided',
    'certification:' || appeal.id::text || ':appeal_upheld', 'Certificate appeal decided', 'Apelación de certificado decidida',
    'The revocation was upheld. Review the private decision in the portal.',
    'Se confirmó la revocación. Revisa la decisión privada en el portal.',
    '/dashboard/certification?decisionId=' || appeal.id::text,
    jsonb_build_object('journeyId', certificate.journey_id, 'decisionId', appeal.id, 'memberUserId', appeal.member_user_id,
      'resultingState', 'revoked', 'effectiveTimestamp', event_time, 'decidingRoleLabel', 'Administrator', 'nextAction', 'review_decision'));
  return appeal;
end;
$$;

create or replace function public.reinstate_certificate_from_appeal(
  actor_user_id uuid, target_appeal_id uuid, target_decision_reason text,
  target_certificate_id uuid, target_certificate_number text, target_template_id uuid,
  target_artifact_object_path text, target_artifact_sha256 text, target_artifact_size_bytes integer,
  target_signatory_one_sha256 text, target_signatory_two_sha256 text
)
returns public.certificates language plpgsql security definer set search_path = public
as $$
declare appeal public.certificate_appeals;
declare predecessor public.certificates;
declare member public.users;
declare journey public.certification_journeys;
declare template public.certificate_templates;
declare certificate public.certificates;
declare facilitator_role_id uuid;
declare role_row_id uuid;
declare role_created boolean := false;
declare event_time timestamptz := now();
begin
  perform public.task_405_assert_actor(actor_user_id);
  if not public.user_has_role(actor_user_id, 'admin') then raise exception 'Only an Administrator may reinstate certification' using errcode = '42501'; end if;
  if char_length(trim(coalesce(target_decision_reason, ''))) < 10 then raise exception 'An appeal decision reason is required' using errcode = '23514'; end if;
  select * into appeal from public.certificate_appeals where id = target_appeal_id for update;
  if appeal.id is null or appeal.status <> 'pending' then raise exception 'The appeal is not pending' using errcode = '23514'; end if;
  select * into predecessor from public.certificates where id = appeal.certificate_id for update;
  if predecessor.status <> 'revoked' then raise exception 'The appealed certificate is not revoked' using errcode = '23514'; end if;
  if predecessor.revoked_by = actor_user_id and exists (
    select 1 from public.user_roles join public.roles on roles.id = user_roles.role_id
    where roles.name = 'admin' and user_roles.user_id <> actor_user_id
  ) then raise exception 'Another Administrator must decide this appeal' using errcode = '42501'; end if;
  select * into member from public.users where id = predecessor.member_user_id;
  select * into journey from public.certification_journeys where id = predecessor.journey_id for update;
  template := public.task_405_validate_artifact(predecessor.member_user_id, target_certificate_id,
    target_certificate_number, target_template_id, target_artifact_object_path, target_artifact_sha256,
    target_artifact_size_bytes, target_signatory_one_sha256, target_signatory_two_sha256);
  insert into public.certificates (
    id, journey_id, assessment_id, member_user_id, certificate_number, official_name_snapshot,
    issuer_name_snapshot, signatory_one_name_snapshot, signatory_one_sha256,
    signatory_two_name_snapshot, signatory_two_sha256, template_id, template_version,
    original_certification_date, issued_at, lifecycle_effective_at, predecessor_certificate_id,
    artifact_object_path, artifact_sha256, artifact_size_bytes, generated_at, issued_by
  ) values (
    target_certificate_id, predecessor.journey_id, predecessor.assessment_id, predecessor.member_user_id,
    target_certificate_number, trim(member.official_full_name), template.issuer_name, template.signatory_one_name,
    template.signatory_one_sha256, template.signatory_two_name, template.signatory_two_sha256, template.id,
    template.version, predecessor.original_certification_date, event_time, event_time, predecessor.id,
    target_artifact_object_path, target_artifact_sha256, target_artifact_size_bytes, event_time, actor_user_id
  ) returning * into certificate;
  select id into facilitator_role_id from public.roles where name = 'facilitator';
  insert into public.user_roles (user_id, role_id, assigned_by, source_certificate_id)
  values (certificate.member_user_id, facilitator_role_id, actor_user_id, certificate.id)
  on conflict (user_id, role_id) do nothing returning id into role_row_id;
  role_created := role_row_id is not null;
  update public.certification_journeys set certification_status = 'active', current_certificate_id = certificate.id
  where id = journey.id;
  update public.certification_progress set status = 'approved', approved_by = actor_user_id,
    approved_at = event_time, updated_at = event_time where practitioner_id = journey.practitioner_id;
  update public.certificate_appeals set status = 'reinstated', decided_by = actor_user_id,
    decided_at = event_time, decision_reason = trim(target_decision_reason),
    reinstatement_certificate_id = certificate.id where id = appeal.id;
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, resulting_status, reason, metadata)
  values (certificate.id, actor_user_id, 'reinstated', 'active', trim(target_decision_reason),
    jsonb_build_object('appealId', appeal.id, 'predecessorCertificateId', predecessor.id, 'roleCreatedByCertificate', role_created));
  perform public.task_405_deliver(certificate.member_user_id, 'certification.reinstated', 'certification_reinstated',
    'certification:' || appeal.id::text || ':reinstated', 'Certification reinstated', 'Certificación restablecida',
    'Your appeal was approved and certification-derived access was restored.',
    'Tu apelación fue aprobada y se restauró el acceso derivado de la certificación.',
    '/dashboard/certification?decisionId=' || appeal.id::text,
    jsonb_build_object('journeyId', journey.id, 'decisionId', appeal.id, 'memberUserId', certificate.member_user_id,
      'resultingState', 'reinstated', 'effectiveTimestamp', event_time, 'decidingRoleLabel', 'Administrator', 'nextAction', 'download_certificate'));
  perform public.task_405_deliver(certificate.member_user_id, 'certificate.issued', 'certificate_issued',
    'certificate:' || certificate.id::text || ':issued', 'New certificate issued', 'Nuevo certificado emitido',
    'A new certificate was issued after reinstatement. The revoked document remains invalid.',
    'Se emitió un nuevo certificado tras el restablecimiento. El documento revocado sigue sin validez.',
    '/dashboard/certification?certificateId=' || certificate.id::text,
    jsonb_build_object('certificateId', certificate.id, 'memberUserId', certificate.member_user_id,
      'certificateNumber', certificate.certificate_number, 'status', 'issued', 'issuedAt', event_time,
      'replacementPredecessorId', predecessor.id, 'locale', 'member'));
  if role_created then
    perform public.task_405_deliver(certificate.member_user_id, 'role.assigned', 'role_assigned',
      'role:' || certificate.id::text || ':assigned', 'Facilitator access restored', 'Acceso de Facilitador restaurado',
      'Certification reinstatement restored Facilitator access without changing profile visibility.',
      'El restablecimiento de la certificación restauró el acceso de Facilitador sin cambiar la visibilidad del perfil.',
      '/dashboard', jsonb_build_object('roleAuditId', certificate.id, 'targetUserId', certificate.member_user_id,
        'roleLabel', 'Facilitator', 'action', 'assigned', 'effectiveTimestamp', event_time, 'actorRoleLabel', 'Administrator'));
  end if;
  return certificate;
end;
$$;

create or replace function public.list_certificate_workflow(actor_user_id uuid)
returns table (
  journey_id uuid, member_user_id uuid, member_name text, current_official_name text,
  journey_state public.certification_journey_state, certification_status public.certification_lifecycle_status,
  assessment_id uuid, certificate_id uuid, certificate_number text, certificate_status public.certificate_status,
  certificate_name_snapshot text, original_certification_date date, issued_at timestamptz,
  lifecycle_effective_at timestamptz, revoked_at timestamptz, revocation_reason text,
  replacement_request_id uuid, replacement_request_status public.certificate_replacement_request_status,
  replacement_request_reason text, appeal_id uuid, appeal_status public.certificate_appeal_status,
  appeal_reason text, appeal_evidence_reference text, appeal_decision_reason text,
  template_ready boolean, can_issue boolean, can_replace boolean, can_revoke boolean,
  can_request_replacement boolean, can_submit_appeal boolean, can_decide_appeal boolean,
  can_download boolean, name_mismatch boolean
)
language plpgsql security definer set search_path = public
as $$
declare actor_is_admin boolean;
begin
  perform public.task_405_assert_actor(actor_user_id);
  actor_is_admin := public.user_has_role(actor_user_id, 'admin');
  return query
  select journeys.id, journeys.trainee_user_id,
    coalesce(nullif(users.official_full_name, ''), nullif(users.full_name, ''), users.email), users.official_full_name,
    journeys.state, journeys.certification_status, assessment.id, certificate.id, certificate.certificate_number,
    certificate.status, certificate.official_name_snapshot, certificate.original_certification_date,
    certificate.issued_at, certificate.lifecycle_effective_at, certificate.revoked_at,
    case when actor_is_admin or journeys.trainee_user_id = actor_user_id then certificate.revocation_reason end,
    replacement.id, replacement.status, replacement.reason,
    appeal.id, appeal.status, appeal.appeal_reason, appeal.evidence_reference, appeal.decision_reason,
    coalesce(template.production_ready, false),
    actor_is_admin and journeys.state = 'assessment_passed' and journeys.certification_status = 'pending'
      and certificate.id is null and assessment.id is not null and nullif(trim(users.official_full_name), '') is not null,
    actor_is_admin and certificate.status = 'active', actor_is_admin and certificate.status = 'active',
    journeys.trainee_user_id = actor_user_id and certificate.status = 'active'
      and replacement.status is distinct from 'pending',
    journeys.trainee_user_id = actor_user_id and certificate.status = 'revoked'
      and appeal.status is distinct from 'pending',
    actor_is_admin and appeal.status = 'pending' and not (
      certificate.revoked_by = actor_user_id and exists (
        select 1 from public.user_roles other_roles join public.roles other_role on other_role.id = other_roles.role_id
        where other_role.name = 'admin' and other_roles.user_id <> actor_user_id
      )
    ),
    certificate.id is not null and (actor_is_admin or (journeys.trainee_user_id = actor_user_id and certificate.status = 'active')),
    certificate.id is not null and nullif(trim(users.official_full_name), '') is distinct from certificate.official_name_snapshot
  from public.certification_journeys journeys
  join public.users users on users.id = journeys.trainee_user_id
  left join lateral (select * from public.assessments where assessments.journey_id = journeys.id and status = 'passed'
    order by assessed_at desc, id desc limit 1) assessment on true
  left join lateral (select * from public.certificates where certificates.journey_id = journeys.id
    order by issued_at desc, id desc limit 1) certificate on true
  left join lateral (select * from public.certificate_replacement_requests
    where certificate_replacement_requests.certificate_id = certificate.id
    order by requested_at desc, id desc limit 1) replacement on true
  left join lateral (select * from public.certificate_appeals where certificate_appeals.certificate_id = certificate.id
    order by submitted_at desc, id desc limit 1) appeal on true
  left join lateral (select * from public.certificate_templates where active limit 1) template on true
  where actor_is_admin or journeys.trainee_user_id = actor_user_id
  order by coalesce(certificate.lifecycle_effective_at, assessment.assessed_at, journeys.updated_at) desc, journeys.id;
end;
$$;

create or replace function public.authorize_certificate_download(actor_user_id uuid, target_certificate_id uuid)
returns table (artifact_object_path text, artifact_sha256 text, artifact_size_bytes integer, certificate_number text)
language plpgsql security definer set search_path = public
as $$
declare certificate public.certificates;
declare is_admin boolean;
begin
  perform public.task_405_assert_actor(actor_user_id);
  select * into certificate from public.certificates where id = target_certificate_id;
  is_admin := public.user_has_role(actor_user_id, 'admin');
  if certificate.id is null or not (is_admin or (certificate.member_user_id = actor_user_id and certificate.status = 'active')) then
    raise exception 'Certificate download is not authorized' using errcode = '42501';
  end if;
  insert into public.certificate_lifecycle_audit (certificate_id, actor_user_id, action, resulting_status)
  values (certificate.id, actor_user_id, case when is_admin then 'administrator_downloaded' else 'member_downloaded' end, certificate.status);
  return query select certificate.artifact_object_path, certificate.artifact_sha256,
    certificate.artifact_size_bytes, certificate.certificate_number;
end;
$$;

create or replace function public.verify_certificate(target_certificate_number text)
returns table (
  certificate_number text, status public.certificate_status, practitioner_stage text,
  original_certification_date date, issued_at timestamptz, lifecycle_effective_at timestamptz,
  revoked_at timestamptz, public_display_name text
)
language sql security definer stable set search_path = public
as $$
  select certificates.certificate_number, certificates.status, certificates.practitioner_stage,
    certificates.original_certification_date, certificates.issued_at, certificates.lifecycle_effective_at,
    certificates.revoked_at,
    case when practitioners.directory_visibility = 'public'
      and practitioners.display_name_visibility = 'public'
      and (public.user_has_role(certificates.member_user_id, 'facilitator')
        or public.user_has_role(certificates.member_user_id, 'instructor'))
      then coalesce(nullif(users.full_name, ''), 'Janzu member') end
  from public.certificates
  join public.users on users.id = certificates.member_user_id and users.is_deleted = false
  left join public.practitioners on practitioners.user_id = certificates.member_user_id
  where certificates.certificate_number = upper(regexp_replace(trim(target_certificate_number), '[^A-Za-z0-9]', '-', 'g'))
  limit 1;
$$;

revoke all on function public.task_405_assert_actor(uuid) from public, anon, authenticated;
revoke all on function public.task_405_validate_artifact(uuid, uuid, text, uuid, text, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.task_405_deliver(uuid, public.transactional_email_event_type, public.notification_type, text, text, text, text, text, text, jsonb, boolean, boolean, public.email_preference_key, timestamptz) from public, anon, authenticated;
revoke all on function public.get_certificate_generation_context(uuid, text, uuid, uuid, uuid) from public, anon;
revoke all on function public.issue_certificate(uuid, uuid, uuid, text, uuid, text, text, integer, text, text) from public, anon;
revoke all on function public.replace_certificate(uuid, uuid, uuid, text, uuid, text, uuid, text, text, integer, text, text) from public, anon;
revoke all on function public.revoke_certificate(uuid, uuid, text, text) from public, anon;
revoke all on function public.request_certificate_replacement(uuid, uuid, text) from public, anon;
revoke all on function public.reject_certificate_replacement_request(uuid, uuid, text) from public, anon;
revoke all on function public.submit_certificate_appeal(uuid, uuid, text, text) from public, anon;
revoke all on function public.uphold_certificate_appeal(uuid, uuid, text) from public, anon;
revoke all on function public.reinstate_certificate_from_appeal(uuid, uuid, text, uuid, text, uuid, text, text, integer, text, text) from public, anon;
revoke all on function public.list_certificate_workflow(uuid) from public, anon;
revoke all on function public.authorize_certificate_download(uuid, uuid) from public, anon;
revoke all on function public.verify_certificate(text) from public;

grant execute on function public.get_certificate_generation_context(uuid, text, uuid, uuid, uuid) to authenticated;
grant execute on function public.issue_certificate(uuid, uuid, uuid, text, uuid, text, text, integer, text, text) to authenticated;
grant execute on function public.replace_certificate(uuid, uuid, uuid, text, uuid, text, uuid, text, text, integer, text, text) to authenticated;
grant execute on function public.revoke_certificate(uuid, uuid, text, text) to authenticated;
grant execute on function public.request_certificate_replacement(uuid, uuid, text) to authenticated;
grant execute on function public.reject_certificate_replacement_request(uuid, uuid, text) to authenticated;
grant execute on function public.submit_certificate_appeal(uuid, uuid, text, text) to authenticated;
grant execute on function public.uphold_certificate_appeal(uuid, uuid, text) to authenticated;
grant execute on function public.reinstate_certificate_from_appeal(uuid, uuid, text, uuid, text, uuid, text, text, integer, text, text) to authenticated;
grant execute on function public.list_certificate_workflow(uuid) to authenticated;
grant execute on function public.authorize_certificate_download(uuid, uuid) to authenticated;
grant execute on function public.verify_certificate(text) to anon, authenticated;

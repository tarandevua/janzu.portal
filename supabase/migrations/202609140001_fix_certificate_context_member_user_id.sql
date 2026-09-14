-- Fix get_certificate_generation_context failing because its member_user_id
-- output variable collided with the certificates.member_user_id column.
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
      or exists (select 1 from public.certificates
        where certificates.member_user_id = journey.trainee_user_id and certificates.status = 'active') then
      raise exception 'The journey is not ready for certificate issuance' using errcode = '23514';
    end if;
    select * into passed_assessment from public.assessments
    where assessments.journey_id = journey.id and assessments.status = 'passed'
    order by assessments.assessed_at desc, assessments.id desc limit 1;
  elsif target_operation = 'replace' then
    select * into certificate from public.certificates
    where certificates.id = target_certificate_id and certificates.status = 'active';
    if certificate.id is null then raise exception 'Only an active certificate can be replaced' using errcode = '23514'; end if;
    select * into journey from public.certification_journeys where certification_journeys.id = certificate.journey_id;
    select * into passed_assessment from public.assessments where assessments.id = certificate.assessment_id;
  else
    select * into appeal from public.certificate_appeals
    where certificate_appeals.id = target_appeal_id and certificate_appeals.status = 'pending';
    if appeal.id is null then raise exception 'The appeal is not pending' using errcode = '23514'; end if;
    select * into certificate from public.certificates
    where certificates.id = appeal.certificate_id and certificates.status = 'revoked';
    select * into journey from public.certification_journeys where certification_journeys.id = certificate.journey_id;
    select * into passed_assessment from public.assessments where assessments.id = certificate.assessment_id;
    if certificate.revoked_by = actor_user_id and exists (
      select 1 from public.user_roles
      join public.roles on roles.id = user_roles.role_id
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

revoke all on function public.get_certificate_generation_context(uuid, text, uuid, uuid, uuid)
from public, anon;
grant execute on function public.get_certificate_generation_context(uuid, text, uuid, uuid, uuid)
to authenticated;

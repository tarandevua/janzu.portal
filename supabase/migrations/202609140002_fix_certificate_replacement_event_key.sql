-- Avoid a PL/pgSQL variable/column collision while notifying Administrators
-- about a member's certificate replacement request.
create or replace function public.request_certificate_replacement(
  actor_user_id uuid, target_certificate_id uuid, target_reason text
)
returns public.certificate_replacement_requests language plpgsql security definer set search_path = public
as $$
declare certificate public.certificates;
declare request public.certificate_replacement_requests;
declare administrator_id uuid;
declare replacement_event_key text;
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
  replacement_event_key := 'certificate-replacement-request:' || request.id::text;
  for administrator_id in select user_roles.user_id from public.user_roles
    join public.roles on roles.id = user_roles.role_id where roles.name = 'admin'
  loop
    insert into public.notifications (user_id, type, title, body, href, event_key)
    values (administrator_id, 'certificate_replacement_requested', 'Certificate replacement requested',
      'Review the private replacement request in the Certification section.',
      '/dashboard/certification?certificateId=' || certificate.id::text,
      replacement_event_key || ':' || administrator_id::text)
    on conflict (event_key) where event_key is not null do nothing;
  end loop;
  return request;
end;
$$;

revoke all on function public.request_certificate_replacement(uuid, uuid, text) from public, anon;
grant execute on function public.request_certificate_replacement(uuid, uuid, text) to authenticated;

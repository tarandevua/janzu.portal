-- TASK-303: WhatsApp contact is private by default and may be projected only
-- to authenticated community members after separate, versioned consent.

alter table public.practitioners
  add column whatsapp_number text,
  add column whatsapp_visibility public.profile_visibility not null default 'private',
  add column whatsapp_consent_granted_at timestamptz,
  add column whatsapp_consent_policy_version text,
  add constraint practitioners_whatsapp_never_public
    check (whatsapp_visibility <> 'public'),
  add constraint practitioners_whatsapp_consent_state
    check (
      (whatsapp_number is null
        and whatsapp_visibility = 'private'
        and whatsapp_consent_granted_at is null
        and whatsapp_consent_policy_version is null)
      or
      (whatsapp_number is not null
        and whatsapp_consent_granted_at is not null
        and whatsapp_consent_policy_version is not null)
    );

create table public.whatsapp_consent_audit (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null check (action in ('granted', 'updated', 'revoked')),
  policy_version text not null,
  previous_visibility public.profile_visibility not null,
  resulting_visibility public.profile_visibility not null,
  occurred_at timestamptz not null default now(),
  constraint whatsapp_consent_audit_visibility_check
    check (previous_visibility <> 'public' and resulting_visibility <> 'public')
);

create index whatsapp_consent_audit_profile_idx
on public.whatsapp_consent_audit(practitioner_id, occurred_at desc);

alter table public.whatsapp_consent_audit enable row level security;

create policy "Members can read their WhatsApp consent audit"
on public.whatsapp_consent_audit
for select to authenticated
using (
  actor_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.practitioners
    where practitioners.id = whatsapp_consent_audit.practitioner_id
      and practitioners.user_id = auth.uid()
  )
);

create function public.update_my_whatsapp_consent(
  actor_user_id uuid,
  target_whatsapp_number text,
  target_visibility public.profile_visibility,
  affirmative_consent boolean,
  target_policy_version text
)
returns public.practitioners
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.practitioners;
  updated_profile public.practitioners;
  normalized_number text;
  audit_action text;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'WhatsApp consent can only be changed by the authenticated member'
      using errcode = '42501';
  end if;

  select * into current_profile
  from public.practitioners
  where user_id = actor_user_id
  for update;

  if current_profile.id is null then
    raise exception 'Create your profile before configuring WhatsApp'
      using errcode = '23514';
  end if;

  if target_visibility = 'public' then
    raise exception 'WhatsApp must never be public' using errcode = '42501';
  end if;

  if not affirmative_consent then
    if target_whatsapp_number is not null or target_visibility <> 'private' then
      raise exception 'Revocation must remove the number and use private visibility'
        using errcode = '23514';
    end if;

    update public.practitioners
    set whatsapp_number = null,
        whatsapp_visibility = 'private',
        whatsapp_consent_granted_at = null,
        whatsapp_consent_policy_version = null
    where id = current_profile.id
    returning * into updated_profile;

    insert into public.whatsapp_consent_audit (
      practitioner_id, actor_user_id, action, policy_version,
      previous_visibility, resulting_visibility
    ) values (
      current_profile.id, actor_user_id, 'revoked', target_policy_version,
      current_profile.whatsapp_visibility, 'private'
    );

    return updated_profile;
  end if;

  normalized_number := regexp_replace(coalesce(target_whatsapp_number, ''), '[^0-9+]', '', 'g');
  if normalized_number !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'WhatsApp number must use international E.164 format'
      using errcode = '22023';
  end if;

  if nullif(trim(target_policy_version), '') is null then
    raise exception 'WhatsApp consent policy version is required'
      using errcode = '22023';
  end if;

  audit_action := case when current_profile.whatsapp_number is null then 'granted' else 'updated' end;

  update public.practitioners
  set whatsapp_number = normalized_number,
      whatsapp_visibility = target_visibility,
      whatsapp_consent_granted_at = now(),
      whatsapp_consent_policy_version = target_policy_version
  where id = current_profile.id
  returning * into updated_profile;

  insert into public.whatsapp_consent_audit (
    practitioner_id, actor_user_id, action, policy_version,
    previous_visibility, resulting_visibility
  ) values (
    current_profile.id, actor_user_id, audit_action, target_policy_version,
    current_profile.whatsapp_visibility, updated_profile.whatsapp_visibility
  );

  return updated_profile;
end;
$$;

drop function public.list_community_practitioner_profiles(uuid);
create function public.list_community_practitioner_profiles(actor_user_id uuid)
returns table (
  id uuid, public_group text, display_name text, bio text, country text, city text,
  languages text[], website text, instagram_url text, facebook_url text,
  youtube_url text, tiktok_url text, profile_image_url text, whatsapp_number text
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not exists (
      select 1 from public.users join public.user_roles on user_roles.user_id = users.id
      where users.id = actor_user_id and users.is_deleted = false
    )
  then
    raise exception 'Community profiles require an active authenticated member'
      using errcode = '42501';
  end if;

  return query
  select practitioners.id,
    case when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant' end,
    case when practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    case when practitioners.bio_visibility in ('community', 'public') then practitioners.bio end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.country end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.city end,
    case when practitioners.languages_visibility in ('community', 'public') then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility in ('community', 'public') then practitioners.website end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.instagram_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.facebook_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.youtube_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility in ('community', 'public') then practitioners.profile_image_url end,
    case when practitioners.whatsapp_visibility = 'community'
      and practitioners.whatsapp_consent_granted_at is not null
      and practitioners.whatsapp_consent_policy_version is not null
      then practitioners.whatsapp_number end
  from public.practitioners join public.users on users.id = practitioners.user_id
  where practitioners.directory_visibility in ('community', 'public') and users.is_deleted = false
  order by practitioners.updated_at desc limit 100;
end;
$$;

drop function public.list_community_practitioner_map_markers(uuid);
create function public.list_community_practitioner_map_markers(actor_user_id uuid)
returns table (
  marker_id uuid, profile_id uuid, public_group text, display_name text,
  city text, country text, latitude double precision, longitude double precision,
  profile_image_url text, whatsapp_number text
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not exists (
      select 1 from public.users join public.user_roles on user_roles.user_id = users.id
      where users.id = actor_user_id and users.is_deleted = false
    )
  then
    raise exception 'Community maps require an active authenticated member' using errcode = '42501';
  end if;

  return query
  select locations.id, practitioners.id,
    case when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant' end,
    case when practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    coalesce(locations.city, practitioners.city), coalesce(locations.country, practitioners.country),
    round(locations.latitude::numeric, 1)::double precision,
    round(locations.longitude::numeric, 1)::double precision,
    case when practitioners.profile_image_visibility in ('community', 'public') then practitioners.profile_image_url end,
    case when practitioners.whatsapp_visibility = 'community'
      and practitioners.whatsapp_consent_granted_at is not null
      and practitioners.whatsapp_consent_policy_version is not null
      then practitioners.whatsapp_number end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  join public.practitioner_locations locations on locations.practitioner_id = practitioners.id
  where practitioners.directory_visibility in ('community', 'public')
    and practitioners.location_visibility in ('community', 'public') and users.is_deleted = false
    and (public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
      or public.user_has_role(practitioners.user_id, 'apprentice')
      or public.user_has_role(practitioners.user_id, 'practitioner')
      or exists (select 1 from public.certification_progress
        where certification_progress.practitioner_id = practitioners.id
          and certification_progress.status = 'approved'))
  order by practitioners.updated_at desc, locations.sort_order, locations.id limit 400;
end;
$$;

drop function public.preview_my_practitioner_map_markers(uuid, public.profile_visibility);
create function public.preview_my_practitioner_map_markers(
  actor_user_id uuid, target_audience public.profile_visibility
)
returns table (
  marker_id uuid, profile_id uuid, public_group text, display_name text,
  city text, country text, latitude double precision, longitude double precision,
  profile_image_url text, whatsapp_number text
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Map previews are limited to the authenticated profile owner' using errcode = '42501';
  end if;
  if target_audience not in ('community', 'public') then
    raise exception 'Map preview audience must be community or public' using errcode = '22023';
  end if;
  if not exists (select 1 from public.users join public.user_roles on user_roles.user_id = users.id
    where users.id = actor_user_id and users.is_deleted = false) then
    raise exception 'Map previews require an active authenticated member' using errcode = '42501';
  end if;

  return query
  select locations.id, practitioners.id,
    case when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant' end,
    case when target_audience = 'public' and practitioners.display_name_visibility = 'public'
      then coalesce(nullif(users.full_name, ''), 'Janzu member')
      when target_audience = 'community' and practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    coalesce(locations.city, practitioners.city), coalesce(locations.country, practitioners.country),
    round(locations.latitude::numeric, 1)::double precision,
    round(locations.longitude::numeric, 1)::double precision,
    case when target_audience = 'public' and practitioners.profile_image_visibility = 'public' then practitioners.profile_image_url
      when target_audience = 'community' and practitioners.profile_image_visibility in ('community', 'public') then practitioners.profile_image_url end,
    case when target_audience = 'community' and practitioners.whatsapp_visibility = 'community'
      and practitioners.whatsapp_consent_granted_at is not null
      and practitioners.whatsapp_consent_policy_version is not null then practitioners.whatsapp_number end
  from public.practitioners join public.users on users.id = practitioners.user_id
  join public.practitioner_locations locations on locations.practitioner_id = practitioners.id
  where practitioners.user_id = actor_user_id and (
    (target_audience = 'public' and practitioners.directory_visibility = 'public'
      and practitioners.location_visibility = 'public'
      and (public.user_has_role(practitioners.user_id, 'facilitator') or public.user_has_role(practitioners.user_id, 'instructor')))
    or
    (target_audience = 'community' and practitioners.directory_visibility in ('community', 'public')
      and practitioners.location_visibility in ('community', 'public')
      and (public.user_has_role(practitioners.user_id, 'facilitator')
        or public.user_has_role(practitioners.user_id, 'instructor')
        or public.user_has_role(practitioners.user_id, 'apprentice')
        or public.user_has_role(practitioners.user_id, 'practitioner')
        or exists (select 1 from public.certification_progress
          where certification_progress.practitioner_id = practitioners.id
            and certification_progress.status = 'approved')))
  ) order by locations.sort_order, locations.id;
end;
$$;

revoke all on table public.whatsapp_consent_audit from anon;
grant select on table public.whatsapp_consent_audit to authenticated;
revoke all on function public.update_my_whatsapp_consent(uuid, text, public.profile_visibility, boolean, text) from public, anon;
revoke all on function public.list_community_practitioner_profiles(uuid) from public, anon;
revoke all on function public.list_community_practitioner_map_markers(uuid) from public, anon;
revoke all on function public.preview_my_practitioner_map_markers(uuid, public.profile_visibility) from public, anon;
grant execute on function public.update_my_whatsapp_consent(uuid, text, public.profile_visibility, boolean, text) to authenticated;
grant execute on function public.list_community_practitioner_profiles(uuid) to authenticated;
grant execute on function public.list_community_practitioner_map_markers(uuid) to authenticated;
grant execute on function public.preview_my_practitioner_map_markers(uuid, public.profile_visibility) to authenticated;

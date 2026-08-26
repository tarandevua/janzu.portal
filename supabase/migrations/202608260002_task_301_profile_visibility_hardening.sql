-- TASK-301: make public/community profile projections data-minimal and keep
-- publication as an explicit member decision.

drop function if exists public.get_public_practitioner_profile(uuid);
drop function if exists public.list_public_practitioner_profiles();
drop function if exists public.list_community_practitioner_profiles(uuid);

create function public.list_public_practitioner_profiles()
returns table (
  id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      else 'instructor'
    end,
    case when practitioners.display_name_visibility = 'public'
      then coalesce(nullif(users.full_name, ''), 'Janzu member')
      else 'Janzu member'
    end,
    case when practitioners.bio_visibility = 'public' then practitioners.bio end,
    case when practitioners.location_visibility = 'public' then practitioners.country end,
    case when practitioners.location_visibility = 'public' then practitioners.city end,
    case when practitioners.languages_visibility = 'public'
      then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility = 'public' then practitioners.website end,
    case when practitioners.social_links_visibility = 'public' then practitioners.instagram_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.facebook_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.youtube_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility = 'public' then practitioners.profile_image_url end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.directory_visibility = 'public'
    and users.is_deleted = false
    and (
      public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
    )
  order by practitioners.updated_at desc
  limit 50;
$$;

create function public.get_public_practitioner_profile(target_profile_id uuid)
returns table (
  id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      else 'instructor'
    end,
    case when practitioners.display_name_visibility = 'public'
      then coalesce(nullif(users.full_name, ''), 'Janzu member')
      else 'Janzu member'
    end,
    case when practitioners.bio_visibility = 'public' then practitioners.bio end,
    case when practitioners.location_visibility = 'public' then practitioners.country end,
    case when practitioners.location_visibility = 'public' then practitioners.city end,
    case when practitioners.languages_visibility = 'public'
      then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility = 'public' then practitioners.website end,
    case when practitioners.social_links_visibility = 'public' then practitioners.instagram_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.facebook_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.youtube_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility = 'public' then practitioners.profile_image_url end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.id = target_profile_id
    and practitioners.directory_visibility = 'public'
    and users.is_deleted = false
    and (
      public.user_has_role(practitioners.user_id, 'facilitator')
      or public.user_has_role(practitioners.user_id, 'instructor')
    )
  limit 1;
$$;

create function public.list_community_practitioner_profiles(actor_user_id uuid)
returns table (
  id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null
    or actor_user_id is distinct from auth.uid()
    or not exists (
      select 1
      from public.users
      join public.user_roles on user_roles.user_id = users.id
      where users.id = actor_user_id
        and users.is_deleted = false
    )
  then
    raise exception 'Community profiles require an active authenticated member'
      using errcode = '42501';
  end if;

  return query
  select
    practitioners.id,
    case
      when public.user_has_role(practitioners.user_id, 'facilitator') then 'facilitator'
      when public.user_has_role(practitioners.user_id, 'instructor') then 'instructor'
      when public.user_has_role(practitioners.user_id, 'apprentice') then 'apprentice'
      else 'participant'
    end,
    case when practitioners.display_name_visibility in ('community', 'public')
      then coalesce(nullif(users.full_name, ''), 'Janzu member') else 'Janzu member' end,
    case when practitioners.bio_visibility in ('community', 'public') then practitioners.bio end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.country end,
    case when practitioners.location_visibility in ('community', 'public') then practitioners.city end,
    case when practitioners.languages_visibility in ('community', 'public')
      then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility in ('community', 'public') then practitioners.website end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.instagram_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.facebook_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.youtube_url end,
    case when practitioners.social_links_visibility in ('community', 'public') then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility in ('community', 'public') then practitioners.profile_image_url end
  from public.practitioners
  join public.users on users.id = practitioners.user_id
  where practitioners.directory_visibility in ('community', 'public')
    and users.is_deleted = false
  order by practitioners.updated_at desc
  limit 100;
end;
$$;

create or replace function public.update_practitioner_public_visibility(
  actor_user_id uuid,
  target_user_id uuid,
  target_is_public boolean
)
returns public.practitioners
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.practitioners;
  updated_profile public.practitioners;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  if target_is_public then
    raise exception 'Only the member may opt a profile into a directory'
      using errcode = '42501';
  end if;

  select * into current_profile
  from public.practitioners
  where user_id = target_user_id
  for update;

  if current_profile.id is null then
    raise exception 'Practitioner profile was not found';
  end if;

  update public.practitioners
  set
    directory_visibility = 'private',
    is_public = false,
    visibility_configured_at = now()
  where id = current_profile.id
  returning * into updated_profile;

  insert into public.profile_visibility_audit (
    practitioner_id,
    actor_user_id,
    previous_settings,
    resulting_settings
  ) values (
    current_profile.id,
    actor_user_id,
    jsonb_build_object(
      'directory', current_profile.directory_visibility,
      'display_name', current_profile.display_name_visibility,
      'profile_image', current_profile.profile_image_visibility,
      'bio', current_profile.bio_visibility,
      'languages', current_profile.languages_visibility,
      'location', current_profile.location_visibility,
      'website', current_profile.website_visibility,
      'social_links', current_profile.social_links_visibility
    ),
    jsonb_build_object(
      'directory', updated_profile.directory_visibility,
      'display_name', updated_profile.display_name_visibility,
      'profile_image', updated_profile.profile_image_visibility,
      'bio', updated_profile.bio_visibility,
      'languages', updated_profile.languages_visibility,
      'location', updated_profile.location_visibility,
      'website', updated_profile.website_visibility,
      'social_links', updated_profile.social_links_visibility
    )
  );

  return updated_profile;
end;
$$;

revoke all on function public.list_public_practitioner_profiles() from public;
revoke all on function public.get_public_practitioner_profile(uuid) from public;
revoke all on function public.list_community_practitioner_profiles(uuid) from public;
revoke all on function public.update_practitioner_public_visibility(uuid, uuid, boolean)
  from public, anon;

grant execute on function public.list_public_practitioner_profiles() to anon, authenticated;
grant execute on function public.get_public_practitioner_profile(uuid) to anon, authenticated;
grant execute on function public.list_community_practitioner_profiles(uuid) to authenticated;
grant execute on function public.update_practitioner_public_visibility(uuid, uuid, boolean)
  to authenticated;

-- TASK-301: field-level visibility with private defaults and safe projections.

create type public.profile_visibility as enum ('private', 'community', 'public');

alter table public.practitioners
  add column directory_visibility public.profile_visibility not null default 'private',
  add column display_name_visibility public.profile_visibility not null default 'private',
  add column profile_image_visibility public.profile_visibility not null default 'private',
  add column bio_visibility public.profile_visibility not null default 'private',
  add column languages_visibility public.profile_visibility not null default 'private',
  add column location_visibility public.profile_visibility not null default 'private',
  add column website_visibility public.profile_visibility not null default 'private',
  add column social_links_visibility public.profile_visibility not null default 'private',
  add column visibility_configured_at timestamptz;

-- Legacy is_public did not capture field-specific consent. Fail closed until the
-- member reviews the new controls.
update public.practitioners
set is_public = false;

drop index if exists practitioners_public_idx;
create index practitioners_directory_visibility_idx
on public.practitioners(directory_visibility)
where directory_visibility <> 'private';

create table public.profile_visibility_audit (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  previous_settings jsonb not null,
  resulting_settings jsonb not null,
  occurred_at timestamptz not null default now()
);

create index profile_visibility_audit_profile_idx
on public.profile_visibility_audit(practitioner_id, occurred_at desc);

alter table public.profile_visibility_audit enable row level security;

create policy "Members can read their profile visibility audit"
on public.profile_visibility_audit
for select to authenticated
using (
  actor_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or exists (
    select 1
    from public.practitioners
    where practitioners.id = profile_visibility_audit.practitioner_id
      and practitioners.user_id = auth.uid()
  )
);

drop policy if exists "Public profiles are readable" on public.practitioners;
drop policy if exists "Public profile locations are readable" on public.practitioner_locations;

create or replace function public.update_my_profile_visibility(
  actor_user_id uuid,
  target_directory_visibility public.profile_visibility,
  target_display_name_visibility public.profile_visibility,
  target_profile_image_visibility public.profile_visibility,
  target_bio_visibility public.profile_visibility,
  target_languages_visibility public.profile_visibility,
  target_location_visibility public.profile_visibility,
  target_website_visibility public.profile_visibility,
  target_social_links_visibility public.profile_visibility
)
returns public.practitioners
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.practitioners;
  updated_profile public.practitioners;
  can_be_public boolean;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Profile visibility can only be changed by the authenticated member'
      using errcode = '42501';
  end if;

  select * into current_profile
  from public.practitioners
  where user_id = actor_user_id
  for update;

  if current_profile.id is null then
    raise exception 'Create your profile before configuring visibility'
      using errcode = '23514';
  end if;

  can_be_public := public.user_has_role(actor_user_id, 'facilitator')
    or public.user_has_role(actor_user_id, 'instructor');

  if not can_be_public and (
    target_directory_visibility = 'public'
    or target_display_name_visibility = 'public'
    or target_profile_image_visibility = 'public'
    or target_bio_visibility = 'public'
    or target_languages_visibility = 'public'
    or target_location_visibility = 'public'
    or target_website_visibility = 'public'
    or target_social_links_visibility = 'public'
  ) then
    raise exception 'Public visibility is limited to verified Facilitators and Instructors'
      using errcode = '42501';
  end if;

  update public.practitioners
  set
    directory_visibility = target_directory_visibility,
    display_name_visibility = target_display_name_visibility,
    profile_image_visibility = target_profile_image_visibility,
    bio_visibility = target_bio_visibility,
    languages_visibility = target_languages_visibility,
    location_visibility = target_location_visibility,
    website_visibility = target_website_visibility,
    social_links_visibility = target_social_links_visibility,
    is_public = target_directory_visibility = 'public',
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
  updated_profile public.practitioners;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  if target_is_public and not (
    public.user_has_role(target_user_id, 'facilitator')
    or public.user_has_role(target_user_id, 'instructor')
  ) then
    raise exception 'Only verified Facilitators and Instructors may appear publicly'
      using errcode = '42501';
  end if;

  update public.practitioners
  set
    directory_visibility = case when target_is_public then 'public' else 'private' end,
    is_public = target_is_public,
    visibility_configured_at = now()
  where user_id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Practitioner profile was not found';
  end if;

  return updated_profile;
end;
$$;

drop function if exists public.get_public_practitioner_profile(uuid);
drop function if exists public.list_public_practitioner_profiles();

create function public.list_public_practitioner_profiles()
returns table (
  id uuid,
  user_id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    practitioners.id,
    practitioners.user_id,
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
    null::double precision,
    null::double precision,
    case when practitioners.languages_visibility = 'public' then practitioners.languages else '{}'::text[] end,
    case when practitioners.website_visibility = 'public' then practitioners.website end,
    case when practitioners.social_links_visibility = 'public' then practitioners.instagram_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.facebook_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.youtube_url end,
    case when practitioners.social_links_visibility = 'public' then practitioners.tiktok_url end,
    case when practitioners.profile_image_visibility = 'public' then practitioners.profile_image_url end,
    true,
    practitioners.created_at,
    practitioners.updated_at
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
  user_id uuid,
  public_group text,
  display_name text,
  bio text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  languages text[],
  website text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  tiktok_url text,
  profile_image_url text,
  is_public boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.list_public_practitioner_profiles()
  where id = target_profile_id
  limit 1;
$$;

grant execute on function public.update_my_profile_visibility(
  uuid,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility
) to authenticated;
grant execute on function public.list_public_practitioner_profiles() to anon, authenticated;
grant execute on function public.get_public_practitioner_profile(uuid) to anon, authenticated;

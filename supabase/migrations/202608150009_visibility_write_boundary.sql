-- Prevent direct PostgREST writes from bypassing field-level visibility rules
-- and audit. Content fields remain editable under the existing owner RLS.

revoke insert, update on table public.practitioners from authenticated;

grant insert (
  user_id,
  bio,
  country,
  city,
  latitude,
  longitude,
  languages,
  website,
  instagram_url,
  facebook_url,
  youtube_url,
  tiktok_url,
  profile_image_url
) on public.practitioners to authenticated;

grant update (
  user_id,
  bio,
  country,
  city,
  latitude,
  longitude,
  languages,
  website,
  instagram_url,
  facebook_url,
  youtube_url,
  tiktok_url,
  profile_image_url
) on public.practitioners to authenticated;

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

  if target_is_public and not (
    public.user_has_role(target_user_id, 'facilitator')
    or public.user_has_role(target_user_id, 'instructor')
  ) then
    raise exception 'Only verified Facilitators and Instructors may appear publicly'
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
    directory_visibility = case when target_is_public then 'public' else 'private' end,
    is_public = target_is_public,
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

create unique index supervision_one_pending_request_idx
on public.supervision_assignments(trainee_user_id)
where status = 'pending';

-- PostgreSQL grants function execution to PUBLIC by default. Keep every
-- identity-bearing or relationship-bearing RPC explicitly authenticated.
revoke all on function public.user_has_role(uuid, public.app_role) from public, anon;
revoke all on function public.can_manage_user_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_active_instructor_for(uuid, uuid) from public, anon;
revoke all on function public.list_available_instructors(uuid) from public, anon;
revoke all on function public.request_supervision(uuid, uuid) from public, anon;
revoke all on function public.respond_to_supervision(uuid, uuid, boolean) from public, anon;
revoke all on function public.end_supervision(uuid, uuid, text) from public, anon;
revoke all on function public.admin_assign_instructor(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.update_my_profile_visibility(
  uuid,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility,
  public.profile_visibility
) from public, anon;
revoke all on function public.update_practitioner_public_visibility(uuid, uuid, boolean)
  from public, anon;
revoke all on function public.review_training_record(uuid, uuid, boolean, text)
  from public, anon;
revoke all on function public.current_verified_training_level(uuid) from public, anon;
revoke all on function public.record_learning_alliance_action(
  uuid, text, text, public.learning_alliance_action
)
  from public, anon;
revoke all on function public.set_onboarding_guide_completion(
  uuid, public.onboarding_guide_key, boolean
)
  from public, anon;
revoke all on function public.list_feedback_participants(uuid) from public, anon;
revoke all on function public.list_feedback_dashboard(uuid, uuid, integer, integer, uuid)
  from public, anon;
revoke all on function public.list_supervision_assignments(uuid) from public, anon;
revoke all on function public.list_available_trainees(uuid) from public, anon;
revoke all on function public.list_community_practitioner_profiles(uuid) from public, anon;
revoke all on function public.list_user_role_management(
  uuid, integer, integer, text, public.app_role, text
)
  from public, anon;

grant execute on function public.user_has_role(uuid, public.app_role) to authenticated;
grant execute on function public.can_manage_user_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_active_instructor_for(uuid, uuid) to authenticated;

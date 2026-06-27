create or replace function public.resubmit_rejected_location(
  target_location_id uuid,
  actor_user_id uuid,
  target_name text,
  target_location_type public.location_type,
  target_description text,
  target_latitude double precision,
  target_longitude double precision,
  target_access_info text
)
returns public.locations
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_location public.locations;
begin
  update public.locations
  set name = target_name,
      location_type = target_location_type,
      description = target_description,
      latitude = target_latitude,
      longitude = target_longitude,
      access_info = target_access_info,
      status = 'pending',
      approved_by = null,
      approved_at = null,
      updated_at = now()
  where locations.id = target_location_id
    and locations.status = 'rejected'
    and exists (
      select 1
      from public.practitioners
      where practitioners.id = locations.submitted_by
        and practitioners.user_id = actor_user_id
    )
  returning * into updated_location;

  if updated_location.id is null then
    raise exception 'Only rejected locations submitted by this user can be edited';
  end if;

  return updated_location;
end;
$$;

grant execute on function public.resubmit_rejected_location(
  uuid,
  uuid,
  text,
  public.location_type,
  text,
  double precision,
  double precision,
  text
) to authenticated;

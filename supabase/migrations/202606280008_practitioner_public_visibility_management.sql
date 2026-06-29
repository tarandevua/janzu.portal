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
  if not (
    public.user_has_role(actor_user_id, 'admin')
    or public.user_has_role(actor_user_id, 'manager')
  ) then
    raise exception 'Only admins and managers can update public profile visibility';
  end if;

  update public.practitioners
  set is_public = target_is_public
  where user_id = target_user_id
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Practitioner profile was not found';
  end if;

  return updated_profile;
end;
$$;

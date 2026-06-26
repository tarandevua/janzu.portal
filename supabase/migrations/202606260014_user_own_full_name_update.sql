create or replace function public.update_current_user_full_name(
  target_user_id uuid,
  target_full_name text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if auth.uid() <> target_user_id then
    raise exception 'Users can only update their own full name';
  end if;

  update public.users
  set full_name = nullif(trim(target_full_name), '')
  where id = target_user_id
  returning * into updated_user;

  return updated_user;
end;
$$;

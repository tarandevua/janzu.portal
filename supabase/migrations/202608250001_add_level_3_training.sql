-- Allow Level 3 training-history records and rank them as the highest verified level.

alter type public.training_level add value if not exists 'level_3';

create or replace function public.current_verified_training_level(target_trainee_user_id uuid)
returns public.training_level
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  current_level public.training_level;
begin
  if auth.uid() is null or not (
    target_trainee_user_id = auth.uid()
    or public.user_has_role(auth.uid(), 'admin')
    or public.is_active_instructor_for(auth.uid(), target_trainee_user_id)
  ) then
    raise exception 'Training level access is not authorized' using errcode = '42501';
  end if;

  select level into current_level
  from public.training_history
  where trainee_user_id = target_trainee_user_id and status = 'verified'
  order by case level::text
    when 'level_3' then 3
    when 'level_2' then 2
    else 1
  end desc, verified_at desc
  limit 1;

  return current_level;
end;
$$;

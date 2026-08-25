-- TASK-401: exact, idempotent training-review notifications and an authorized
-- Trainee identity projection for the reviewer workspace.

alter table public.notifications
add column event_key text;

create unique index notifications_event_key_uidx
on public.notifications(event_key)
where event_key is not null;

create or replace function public.audit_training_history_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_action text;
  audit_event_id uuid;
  recipient_user_id uuid;
  recipient_locale text;
  trainee_display_name text;
  localized_level text;
  notification_kind public.notification_type;
  notification_title text;
  notification_body text;
begin
  audit_action := case
    when tg_op = 'INSERT' then 'submitted'
    when old.status is distinct from new.status and new.status = 'claimed' then 'corrected'
    when old.status is distinct from new.status then 'reviewed'
    else 'corrected'
  end;

  insert into public.training_history_audit (
    training_record_id,
    actor_user_id,
    action,
    previous_record,
    resulting_record
  ) values (
    new.id,
    auth.uid(),
    audit_action,
    case when tg_op = 'UPDATE' then to_jsonb(old) end,
    to_jsonb(new)
  )
  returning id into audit_event_id;

  if audit_action not in ('submitted', 'corrected') then
    return new;
  end if;

  select
    assignments.instructor_user_id,
    case when instructors.preferred_locale = 'es' then 'es' else 'en' end,
    coalesce(nullif(trainees.full_name, ''), 'Janzu Trainee')
  into recipient_user_id, recipient_locale, trainee_display_name
  from public.supervision_assignments as assignments
  join public.users as instructors on instructors.id = assignments.instructor_user_id
  join public.users as trainees on trainees.id = assignments.trainee_user_id
  where assignments.trainee_user_id = new.trainee_user_id
    and assignments.status = 'active'
  limit 1;

  if recipient_user_id is null then
    return new;
  end if;

  localized_level := case new.level::text
    when 'level_1' then case when recipient_locale = 'es' then 'Nivel 1' else 'Level 1' end
    when 'level_2' then case when recipient_locale = 'es' then 'Nivel 2' else 'Level 2' end
    when 'level_3' then case when recipient_locale = 'es' then 'Nivel 3' else 'Level 3' end
    else new.level::text
  end;

  if audit_action = 'submitted' then
    notification_kind := 'training_history_submitted';
    notification_title := case
      when recipient_locale = 'es' then 'Historial de formación enviado'
      else 'Training history submitted'
    end;
    notification_body := case
      when recipient_locale = 'es' then trainee_display_name || ' envió un registro de ' || localized_level || ' para revisión.'
      else trainee_display_name || ' submitted a ' || localized_level || ' record for review.'
    end;
  else
    notification_kind := 'training_history_corrected';
    notification_title := case
      when recipient_locale = 'es' then 'Historial de formación corregido'
      else 'Training history corrected'
    end;
    notification_body := case
      when recipient_locale = 'es' then trainee_display_name || ' corrigió y reenvió un registro de ' || localized_level || '.'
      else trainee_display_name || ' corrected and resubmitted a ' || localized_level || ' record.'
    end;
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body,
    href,
    event_key
  ) values (
    recipient_user_id,
    notification_kind,
    notification_title,
    notification_body,
    '/dashboard/training?traineeId=' || new.trainee_user_id::text || '&recordId=' || new.id::text,
    'training_history.' || audit_action || ':' || audit_event_id::text || ':' || recipient_user_id::text
  )
  on conflict (event_key) where event_key is not null do nothing;

  return new;
end;
$$;

create or replace function public.get_training_history_subject(
  actor_user_id uuid,
  target_trainee_user_id uuid
)
returns table (
  trainee_user_id uuid,
  display_name text,
  profile_image_url text,
  active_assignment_id uuid,
  active_instructor_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Training subject access is limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not (
    target_trainee_user_id = actor_user_id
    or public.user_has_role(actor_user_id, 'admin')
    or public.is_active_instructor_for(actor_user_id, target_trainee_user_id)
  ) then
    raise exception 'Training subject access is not authorized'
      using errcode = '42501';
  end if;

  return query
  select
    trainees.id,
    coalesce(nullif(trainees.full_name, ''), 'Janzu Trainee'),
    case
      when profiles.profile_image_visibility in ('community', 'public')
        then profiles.profile_image_url
    end,
    assignments.id,
    coalesce(nullif(instructors.full_name, ''), 'Janzu Instructor')
  from public.users as trainees
  left join public.practitioners as profiles on profiles.user_id = trainees.id
  left join public.supervision_assignments as assignments
    on assignments.trainee_user_id = trainees.id
    and assignments.status = 'active'
  left join public.users as instructors on instructors.id = assignments.instructor_user_id
  where trainees.id = target_trainee_user_id
    and not trainees.is_deleted
  limit 1;
end;
$$;

revoke all on function public.get_training_history_subject(uuid, uuid) from public, anon;
grant execute on function public.get_training_history_subject(uuid, uuid) to authenticated;

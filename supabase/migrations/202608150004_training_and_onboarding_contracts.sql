-- TASK-401 and TASK-101 prerequisite contracts.

create type public.training_level as enum ('level_1', 'level_2');
create type public.training_record_status as enum ('claimed', 'verified', 'rejected');

create table public.training_history (
  id uuid primary key default gen_random_uuid(),
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  level public.training_level not null,
  cohort text not null,
  location text not null,
  started_on date not null,
  completed_on date not null,
  teaching_instructor_name text not null,
  coursework_complete boolean not null default false,
  evidence_reference text,
  notes text,
  status public.training_record_status not null default 'claimed',
  verified_by uuid references public.users(id) on delete set null,
  verified_under_assignment_id uuid references public.supervision_assignments(id) on delete restrict,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_dates_ordered check (completed_on >= started_on),
  constraint training_cohort_length check (char_length(cohort) between 1 and 160),
  constraint training_location_length check (char_length(location) between 1 and 240),
  constraint training_instructor_length check (char_length(teaching_instructor_name) between 1 and 160),
  constraint training_evidence_length check (char_length(coalesce(evidence_reference, '')) <= 1000),
  constraint training_notes_length check (char_length(coalesce(notes, '')) <= 2000),
  constraint training_rejection_length check (char_length(coalesce(rejection_reason, '')) <= 1000)
);

create index training_history_trainee_idx
on public.training_history(trainee_user_id, level, created_at desc);

create index training_history_review_idx
on public.training_history(status, created_at)
where status = 'claimed';

create trigger training_history_set_updated_at
before update on public.training_history
for each row execute function public.set_updated_at();

create table public.training_history_audit (
  id uuid primary key default gen_random_uuid(),
  training_record_id uuid not null references public.training_history(id) on delete restrict,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  previous_record jsonb,
  resulting_record jsonb not null,
  occurred_at timestamptz not null default now()
);

create index training_history_audit_record_idx
on public.training_history_audit(training_record_id, occurred_at);

create or replace function public.audit_training_history_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.training_history_audit (
    training_record_id,
    actor_user_id,
    action,
    previous_record,
    resulting_record
  ) values (
    new.id,
    auth.uid(),
    case
      when tg_op = 'INSERT' then 'submitted'
      when old.status is distinct from new.status and new.status = 'claimed' then 'corrected'
      when old.status is distinct from new.status then 'reviewed'
      else 'corrected'
    end,
    case when tg_op = 'UPDATE' then to_jsonb(old) end,
    to_jsonb(new)
  );

  return new;
end;
$$;

create trigger training_history_audit_changes
after insert or update on public.training_history
for each row execute function public.audit_training_history_change();

alter table public.training_history enable row level security;
alter table public.training_history_audit enable row level security;

create policy "Authorized participants can read training history"
on public.training_history
for select to authenticated
using (
  trainee_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
  or public.is_active_instructor_for(auth.uid(), trainee_user_id)
);

create policy "Trainees can submit their training history"
on public.training_history
for insert to authenticated
with check (
  trainee_user_id = auth.uid()
  and public.user_has_role(auth.uid(), 'apprentice')
  and status = 'claimed'
  and verified_by is null
  and verified_at is null
  and verified_under_assignment_id is null
);

create policy "Trainees can correct unreviewed training history"
on public.training_history
for update to authenticated
using (trainee_user_id = auth.uid() and status in ('claimed', 'rejected'))
with check (
  trainee_user_id = auth.uid()
  and status = 'claimed'
  and verified_by is null
  and verified_at is null
  and verified_under_assignment_id is null
);

create policy "Authorized participants can read training audit"
on public.training_history_audit
for select to authenticated
using (
  public.user_has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.training_history
    where training_history.id = training_history_audit.training_record_id
      and (
        training_history.trainee_user_id = auth.uid()
        or public.is_active_instructor_for(auth.uid(), training_history.trainee_user_id)
      )
  )
);

create or replace function public.review_training_record(
  actor_user_id uuid,
  target_record_id uuid,
  approve_record boolean,
  review_reason text default null
)
returns public.training_history
language plpgsql
security definer
set search_path = public
as $$
declare
  current_record public.training_history;
  active_assignment_id uuid;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Training review is limited to the authenticated user'
      using errcode = '42501';
  end if;

  select * into current_record
  from public.training_history
  where id = target_record_id
  for update;

  if current_record.id is null or current_record.status <> 'claimed' then
    raise exception 'The training record is not available for review'
      using errcode = '23514';
  end if;

  if public.user_has_role(actor_user_id, 'admin') then
    active_assignment_id := null;
  else
    select id into active_assignment_id
    from public.supervision_assignments
    where trainee_user_id = current_record.trainee_user_id
      and instructor_user_id = actor_user_id
      and status = 'active';

    if active_assignment_id is null then
      raise exception 'Only the active Instructor or an Administrator may review training'
        using errcode = '42501';
    end if;
  end if;

  if approve_record and not current_record.coursework_complete then
    raise exception 'Mandatory coursework must be complete before verification'
      using errcode = '23514';
  end if;

  if not approve_record and nullif(trim(coalesce(review_reason, '')), '') is null then
    raise exception 'A rejection reason is required' using errcode = '23514';
  end if;

  update public.training_history
  set
    status = (
      case when approve_record then 'verified' else 'rejected' end
    )::public.training_record_status,
    verified_by = actor_user_id,
    verified_under_assignment_id = active_assignment_id,
    verified_at = now(),
    rejection_reason = case when approve_record then null else trim(review_reason) end
  where id = target_record_id
  returning * into current_record;

  perform public.insert_notification(
    current_record.trainee_user_id,
    'training_history_reviewed',
    'Training history reviewed',
    case
      when approve_record then 'A training record was verified.'
      else 'A training record needs correction. Open Training history for details.'
    end,
    '/dashboard/training'
  );

  return current_record;
end;
$$;

create or replace function public.current_verified_training_level(target_trainee_user_id uuid)
returns public.training_level
language sql
security definer
set search_path = public
stable
as $$
  select level
  from public.training_history
  where trainee_user_id = target_trainee_user_id
    and status = 'verified'
  order by case level when 'level_2' then 2 else 1 end desc, verified_at desc
  limit 1;
$$;

grant execute on function public.review_training_record(uuid, uuid, boolean, text) to authenticated;
grant execute on function public.current_verified_training_level(uuid) to authenticated;

create type public.learning_alliance_action as enum ('accepted', 'revoked');
create type public.onboarding_guide_key as enum ('calendar', 'sessions', 'feedback');

create table public.learning_alliance_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  policy_version text not null,
  locale text not null check (locale in ('en', 'es')),
  action public.learning_alliance_action not null,
  occurred_at timestamptz not null default now()
);

create index learning_alliance_user_version_idx
on public.learning_alliance_acknowledgements(user_id, policy_version, occurred_at desc);

create table public.onboarding_guide_completions (
  user_id uuid not null references public.users(id) on delete cascade,
  guide_key public.onboarding_guide_key not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, guide_key)
);

alter table public.learning_alliance_acknowledgements enable row level security;
alter table public.onboarding_guide_completions enable row level security;

create policy "Members can read their Learning Alliance history"
on public.learning_alliance_acknowledgements
for select to authenticated
using (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

create policy "Members can read their guide completion"
on public.onboarding_guide_completions
for select to authenticated
using (user_id = auth.uid() or public.user_has_role(auth.uid(), 'admin'));

create or replace function public.record_learning_alliance_action(
  actor_user_id uuid,
  target_policy_version text,
  target_locale text,
  target_action public.learning_alliance_action
)
returns public.learning_alliance_acknowledgements
language plpgsql
security definer
set search_path = public
as $$
declare
  recorded_event public.learning_alliance_acknowledgements;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Learning Alliance acknowledgement is limited to the authenticated member'
      using errcode = '42501';
  end if;

  if target_policy_version <> '2026-08-15-v1' then
    raise exception 'The Learning Alliance version is not current' using errcode = '23514';
  end if;

  if target_locale not in ('en', 'es') then
    raise exception 'A supported locale is required' using errcode = '23514';
  end if;

  insert into public.learning_alliance_acknowledgements (
    user_id,
    actor_user_id,
    policy_version,
    locale,
    action
  ) values (
    actor_user_id,
    actor_user_id,
    target_policy_version,
    target_locale,
    target_action
  ) returning * into recorded_event;

  return recorded_event;
end;
$$;

create or replace function public.set_onboarding_guide_completion(
  actor_user_id uuid,
  target_guide_key public.onboarding_guide_key,
  target_completed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Onboarding progress is limited to the authenticated member'
      using errcode = '42501';
  end if;

  if target_completed then
    insert into public.onboarding_guide_completions (user_id, guide_key)
    values (actor_user_id, target_guide_key)
    on conflict (user_id, guide_key) do update set completed_at = now();
  else
    delete from public.onboarding_guide_completions
    where user_id = actor_user_id and guide_key = target_guide_key;
  end if;
end;
$$;

grant execute on function public.record_learning_alliance_action(
  uuid, text, text, public.learning_alliance_action
) to authenticated;
grant execute on function public.set_onboarding_guide_completion(
  uuid, public.onboarding_guide_key, boolean
) to authenticated;

-- TASK-201 / TASK-202: migrate the legacy Manager identifier and add
-- relationship-scoped Instructor authorization.

update public.roles
set
  name = 'instructor',
  description = 'Supervision access limited to actively assigned Trainees.'
where name = 'manager';

insert into public.roles (name, description)
values ('instructor', 'Supervision access limited to actively assigned Trainees.')
on conflict (name) do update set description = excluded.description;

create or replace function public.user_has_role(target_user_id uuid, role_name public.app_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    join public.roles on roles.id = user_roles.role_id
    where user_roles.user_id = target_user_id
      and roles.name = role_name
  );
$$;

create or replace function public.can_manage_user_role(
  actor_user_id uuid,
  target_role public.app_role
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select actor_user_id = auth.uid()
    and public.user_has_role(actor_user_id, 'admin');
$$;

create table public.role_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_name public.app_role not null,
  action text not null check (action in ('assigned', 'removed', 'migrated')),
  actor_user_id uuid references public.users(id) on delete set null,
  reason text,
  occurred_at timestamptz not null default now()
);

create index role_assignment_audit_user_idx
on public.role_assignment_audit(user_id, occurred_at desc);

insert into public.role_assignment_audit (user_id, role_name, action, actor_user_id, reason, occurred_at)
select
  user_roles.user_id,
  'instructor',
  'migrated',
  user_roles.assigned_by,
  'Migrated from the legacy Manager identifier under DEC-01.',
  now()
from public.user_roles
join public.roles on roles.id = user_roles.role_id
where roles.name = 'instructor';

create or replace function public.audit_user_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_role public.app_role;
begin
  select name into changed_role
  from public.roles
  where id = coalesce(new.role_id, old.role_id);

  insert into public.role_assignment_audit (
    user_id,
    role_name,
    action,
    actor_user_id,
    reason
  ) values (
    coalesce(new.user_id, old.user_id),
    changed_role,
    case when tg_op = 'INSERT' then 'assigned' else 'removed' end,
    case when tg_op = 'INSERT' then new.assigned_by else auth.uid() end,
    case when tg_op = 'INSERT' then 'Role assigned.' else 'Role removed.' end
  );

  return coalesce(new, old);
end;
$$;

create trigger user_roles_audit_changes
after insert or delete on public.user_roles
for each row execute function public.audit_user_role_change();

alter table public.role_assignment_audit enable row level security;

create policy "Admins can read role assignment audit"
on public.role_assignment_audit
for select to authenticated
using (public.user_has_role(auth.uid(), 'admin'));

create type public.supervision_status as enum (
  'pending',
  'active',
  'declined',
  'ended',
  'cancelled'
);

create table public.supervision_assignments (
  id uuid primary key default gen_random_uuid(),
  trainee_user_id uuid not null references public.users(id) on delete restrict,
  instructor_user_id uuid not null references public.users(id) on delete restrict,
  status public.supervision_status not null default 'pending',
  requested_by uuid not null references public.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  responded_by uuid references public.users(id) on delete set null,
  responded_at timestamptz,
  ended_by uuid references public.users(id) on delete set null,
  ended_at timestamptz,
  end_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supervision_people_differ check (trainee_user_id <> instructor_user_id),
  constraint supervision_end_reason_length check (char_length(coalesce(end_reason, '')) <= 500)
);

create unique index supervision_one_active_instructor_idx
on public.supervision_assignments(trainee_user_id)
where status = 'active';

create unique index supervision_one_pending_pair_idx
on public.supervision_assignments(trainee_user_id, instructor_user_id)
where status = 'pending';

create index supervision_instructor_status_idx
on public.supervision_assignments(instructor_user_id, status, updated_at desc);

create index supervision_trainee_status_idx
on public.supervision_assignments(trainee_user_id, status, updated_at desc);

create trigger supervision_assignments_set_updated_at
before update on public.supervision_assignments
for each row execute function public.set_updated_at();

create table public.supervision_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.supervision_assignments(id) on delete restrict,
  actor_user_id uuid not null references public.users(id) on delete restrict,
  action text not null,
  previous_status public.supervision_status,
  resulting_status public.supervision_status not null,
  reason text,
  occurred_at timestamptz not null default now()
);

create index supervision_audit_assignment_idx
on public.supervision_assignment_audit(assignment_id, occurred_at);

create or replace function public.is_active_instructor_for(
  candidate_instructor_id uuid,
  candidate_trainee_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.supervision_assignments
    where instructor_user_id = candidate_instructor_id
      and trainee_user_id = candidate_trainee_id
      and status = 'active'
  );
$$;

create or replace function public.list_available_instructors(actor_user_id uuid)
returns table (
  user_id uuid,
  display_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Instructor discovery is limited to the authenticated user'
      using errcode = '42501';
  end if;

  return query
  select users.id, coalesce(nullif(users.full_name, ''), 'Janzu Instructor')
  from public.users
  join public.user_roles on user_roles.user_id = users.id
  join public.roles on roles.id = user_roles.role_id
  where roles.name = 'instructor'
    and users.is_deleted = false
  order by coalesce(nullif(users.full_name, ''), 'Janzu Instructor');
end;
$$;

create or replace function public.request_supervision(
  actor_user_id uuid,
  target_instructor_user_id uuid
)
returns public.supervision_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  created_assignment public.supervision_assignments;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision requests are limited to the authenticated user'
      using errcode = '42501';
  end if;

  if not public.user_has_role(actor_user_id, 'apprentice') then
    raise exception 'Only Trainees can request an Instructor' using errcode = '42501';
  end if;

  if not public.user_has_role(target_instructor_user_id, 'instructor') then
    raise exception 'The selected user is not an Instructor' using errcode = '23514';
  end if;

  insert into public.supervision_assignments (
    trainee_user_id,
    instructor_user_id,
    requested_by
  ) values (
    actor_user_id,
    target_instructor_user_id,
    actor_user_id
  )
  returning * into created_assignment;

  insert into public.supervision_assignment_audit (
    assignment_id,
    actor_user_id,
    action,
    resulting_status
  ) values (
    created_assignment.id,
    actor_user_id,
    'requested',
    'pending'
  );

  perform public.insert_notification(
    target_instructor_user_id,
    'supervision_requested',
    'Instructor request received',
    'A Trainee asked you to become their Instructor.',
    '/dashboard/supervision'
  );

  return created_assignment;
end;
$$;

create or replace function public.respond_to_supervision(
  actor_user_id uuid,
  assignment_id uuid,
  accept_request boolean
)
returns public.supervision_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_assignment public.supervision_assignments;
  previous_assignment public.supervision_assignments;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision review is limited to the authenticated user'
      using errcode = '42501';
  end if;

  select * into current_assignment
  from public.supervision_assignments
  where id = assignment_id
  for update;

  if current_assignment.id is null
    or current_assignment.instructor_user_id <> actor_user_id
    or current_assignment.status <> 'pending'
  then
    raise exception 'The pending supervision request is not available'
      using errcode = '42501';
  end if;

  if accept_request then
    select * into previous_assignment
    from public.supervision_assignments
    where trainee_user_id = current_assignment.trainee_user_id
      and status = 'active'
    for update;

    if previous_assignment.id is not null then
      update public.supervision_assignments
      set
        status = 'ended',
        ended_by = actor_user_id,
        ended_at = now(),
        end_reason = 'Transferred to a new Instructor.'
      where id = previous_assignment.id;

      insert into public.supervision_assignment_audit (
        assignment_id,
        actor_user_id,
        action,
        previous_status,
        resulting_status,
        reason
      ) values (
        previous_assignment.id,
        actor_user_id,
        'transferred_out',
        'active',
        'ended',
        'Transferred to a new Instructor.'
      );
    end if;

    update public.supervision_assignments
    set status = 'active', responded_by = actor_user_id, responded_at = now()
    where id = assignment_id
    returning * into current_assignment;

    insert into public.supervision_assignment_audit (
      assignment_id, actor_user_id, action, previous_status, resulting_status
    ) values (
      assignment_id, actor_user_id, 'accepted', 'pending', 'active'
    );

    perform public.insert_notification(
      current_assignment.trainee_user_id,
      'supervision_accepted',
      'Instructor request accepted',
      'Your Instructor request was accepted.',
      '/dashboard/supervision'
    );
  else
    update public.supervision_assignments
    set status = 'declined', responded_by = actor_user_id, responded_at = now()
    where id = assignment_id
    returning * into current_assignment;

    insert into public.supervision_assignment_audit (
      assignment_id, actor_user_id, action, previous_status, resulting_status
    ) values (
      assignment_id, actor_user_id, 'declined', 'pending', 'declined'
    );

    perform public.insert_notification(
      current_assignment.trainee_user_id,
      'supervision_declined',
      'Instructor request declined',
      'Your Instructor request was declined. You may select another Instructor.',
      '/dashboard/supervision'
    );
  end if;

  return current_assignment;
end;
$$;

create or replace function public.end_supervision(
  actor_user_id uuid,
  assignment_id uuid,
  reason text
)
returns public.supervision_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  current_assignment public.supervision_assignments;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid() then
    raise exception 'Supervision changes are limited to the authenticated user'
      using errcode = '42501';
  end if;

  select * into current_assignment
  from public.supervision_assignments
  where id = assignment_id
  for update;

  if current_assignment.id is null
    or current_assignment.status not in ('pending', 'active')
    or not (
      actor_user_id in (current_assignment.trainee_user_id, current_assignment.instructor_user_id)
      or public.user_has_role(actor_user_id, 'admin')
    )
  then
    raise exception 'The supervision assignment cannot be ended'
      using errcode = '42501';
  end if;

  update public.supervision_assignments
  set
    status = case when current_assignment.status = 'pending' then 'cancelled' else 'ended' end,
    ended_by = actor_user_id,
    ended_at = now(),
    end_reason = nullif(trim(reason), '')
  where id = assignment_id
  returning * into current_assignment;

  insert into public.supervision_assignment_audit (
    assignment_id,
    actor_user_id,
    action,
    previous_status,
    resulting_status,
    reason
  ) values (
    assignment_id,
    actor_user_id,
    'ended',
    case when current_assignment.status = 'cancelled' then 'pending' else 'active' end,
    current_assignment.status,
    current_assignment.end_reason
  );

  perform public.insert_notification(
    case
      when actor_user_id = current_assignment.trainee_user_id
        then current_assignment.instructor_user_id
      else current_assignment.trainee_user_id
    end,
    'supervision_ended',
    'Supervision relationship updated',
    'A supervision relationship has ended.',
    '/dashboard/supervision'
  );

  return current_assignment;
end;
$$;

create or replace function public.admin_assign_instructor(
  actor_user_id uuid,
  target_trainee_user_id uuid,
  target_instructor_user_id uuid,
  reason text
)
returns public.supervision_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  prior_assignment public.supervision_assignments;
  pending_assignment public.supervision_assignments;
  created_assignment public.supervision_assignments;
begin
  if auth.uid() is null or actor_user_id is distinct from auth.uid()
    or not public.user_has_role(actor_user_id, 'admin')
  then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;

  if not public.user_has_role(target_trainee_user_id, 'apprentice')
    or not public.user_has_role(target_instructor_user_id, 'instructor')
  then
    raise exception 'A Trainee and Instructor are required' using errcode = '23514';
  end if;

  for pending_assignment in
    select *
    from public.supervision_assignments
    where trainee_user_id = target_trainee_user_id and status = 'pending'
    for update
  loop
    update public.supervision_assignments
    set
      status = 'cancelled',
      ended_by = actor_user_id,
      ended_at = now(),
      end_reason = 'Superseded by an Administrator assignment.'
    where id = pending_assignment.id;

    insert into public.supervision_assignment_audit (
      assignment_id, actor_user_id, action, previous_status, resulting_status, reason
    ) values (
      pending_assignment.id,
      actor_user_id,
      'admin_cancelled_pending',
      'pending',
      'cancelled',
      'Superseded by an Administrator assignment.'
    );

    perform public.insert_notification(
      pending_assignment.instructor_user_id,
      'supervision_ended',
      'Instructor request closed',
      'A pending Instructor request was superseded by an Administrator assignment.',
      '/dashboard/supervision'
    );
  end loop;

  select * into prior_assignment
  from public.supervision_assignments
  where trainee_user_id = target_trainee_user_id and status = 'active'
  for update;

  if prior_assignment.id is not null then
    update public.supervision_assignments
    set status = 'ended', ended_by = actor_user_id, ended_at = now(), end_reason = reason
    where id = prior_assignment.id;

    insert into public.supervision_assignment_audit (
      assignment_id, actor_user_id, action, previous_status, resulting_status, reason
    ) values (
      prior_assignment.id, actor_user_id, 'admin_transfer', 'active', 'ended', reason
    );

    perform public.insert_notification(
      prior_assignment.instructor_user_id,
      'supervision_ended',
      'Supervision relationship updated',
      'An Administrator transferred a Trainee to another Instructor.',
      '/dashboard/supervision'
    );
  end if;

  insert into public.supervision_assignments (
    trainee_user_id,
    instructor_user_id,
    status,
    requested_by,
    responded_by,
    responded_at
  ) values (
    target_trainee_user_id,
    target_instructor_user_id,
    'active',
    actor_user_id,
    actor_user_id,
    now()
  ) returning * into created_assignment;

  insert into public.supervision_assignment_audit (
    assignment_id, actor_user_id, action, resulting_status, reason
  ) values (
    created_assignment.id, actor_user_id, 'admin_assigned', 'active', reason
  );

  perform public.insert_notification(
    target_trainee_user_id,
    'supervision_accepted',
    'Instructor assigned',
    'An Administrator assigned your Instructor.',
    '/dashboard/supervision'
  );

  perform public.insert_notification(
    target_instructor_user_id,
    'supervision_accepted',
    'Trainee assigned',
    'An Administrator assigned a Trainee to you.',
    '/dashboard/supervision'
  );

  return created_assignment;
end;
$$;

alter table public.supervision_assignments enable row level security;
alter table public.supervision_assignment_audit enable row level security;

create policy "Supervision participants can read assignments"
on public.supervision_assignments
for select to authenticated
using (
  trainee_user_id = auth.uid()
  or instructor_user_id = auth.uid()
  or public.user_has_role(auth.uid(), 'admin')
);

create policy "Supervision participants can read audit"
on public.supervision_assignment_audit
for select to authenticated
using (
  public.user_has_role(auth.uid(), 'admin')
  or exists (
    select 1 from public.supervision_assignments
    where supervision_assignments.id = supervision_assignment_audit.assignment_id
      and auth.uid() in (
        supervision_assignments.trainee_user_id,
        supervision_assignments.instructor_user_id
      )
  )
);

create policy "Assigned Instructors can read Trainee users"
on public.users
for select to authenticated
using (
  public.is_active_instructor_for(auth.uid(), id)
  or public.is_active_instructor_for(id, auth.uid())
);

create policy "Assigned Instructors can read Trainee profiles"
on public.practitioners
for select to authenticated
using (public.is_active_instructor_for(auth.uid(), user_id));

grant execute on function public.is_active_instructor_for(uuid, uuid) to authenticated;
grant execute on function public.list_available_instructors(uuid) to authenticated;
grant execute on function public.request_supervision(uuid, uuid) to authenticated;
grant execute on function public.respond_to_supervision(uuid, uuid, boolean) to authenticated;
grant execute on function public.end_supervision(uuid, uuid, text) to authenticated;
grant execute on function public.admin_assign_instructor(uuid, uuid, uuid, text) to authenticated;

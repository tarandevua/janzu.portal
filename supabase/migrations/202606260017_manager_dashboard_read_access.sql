drop policy if exists "Managers can read users for operations" on public.users;
create policy "Managers can read users for operations"
on public.users
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));

drop policy if exists "Managers can read practitioners for operations" on public.practitioners;
create policy "Managers can read practitioners for operations"
on public.practitioners
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));

drop policy if exists "Managers can read sessions for operations" on public.sessions;
create policy "Managers can read sessions for operations"
on public.sessions
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));

drop policy if exists "Managers can read session requests for operations" on public.session_requests;
create policy "Managers can read session requests for operations"
on public.session_requests
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));

drop policy if exists "Managers can read feedback for operations" on public.session_feedback;
create policy "Managers can read feedback for operations"
on public.session_feedback
for select
to authenticated
using (public.user_has_role(auth.uid(), 'manager'));

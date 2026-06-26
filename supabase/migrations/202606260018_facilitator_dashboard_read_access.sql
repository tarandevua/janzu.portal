drop policy if exists "Facilitators can read users for session operations" on public.users;
create policy "Facilitators can read users for session operations"
on public.users
for select
to authenticated
using (public.user_has_role(auth.uid(), 'facilitator'));

drop policy if exists "Facilitators can read practitioners for session operations" on public.practitioners;
create policy "Facilitators can read practitioners for session operations"
on public.practitioners
for select
to authenticated
using (public.user_has_role(auth.uid(), 'facilitator'));

drop policy if exists "Facilitators can read sessions for session operations" on public.sessions;
create policy "Facilitators can read sessions for session operations"
on public.sessions
for select
to authenticated
using (public.user_has_role(auth.uid(), 'facilitator'));

drop policy if exists "Facilitators can read session requests for session operations" on public.session_requests;
create policy "Facilitators can read session requests for session operations"
on public.session_requests
for select
to authenticated
using (public.user_has_role(auth.uid(), 'facilitator'));

drop policy if exists "Facilitators can read feedback for session operations" on public.session_feedback;
create policy "Facilitators can read feedback for session operations"
on public.session_feedback
for select
to authenticated
using (public.user_has_role(auth.uid(), 'facilitator'));

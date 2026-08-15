# Sprint 14 - User and Role Management

> Historical note: this sprint used the legacy Manager model. TASK-201 supersedes it: the persisted role is now `instructor`, and only Administrators may manage unrelated users or roles.

## Goal

Add the missing admin and manager workflow for managing portal users and their roles.

## Tasks

- Add controlled database RPC functions for listing users and assigning/removing roles.
- Allow admins to manage all roles.
- Allow managers to manage practitioner and facilitator roles only.
- Add REST endpoints and server actions for role changes.
- Add user invite workflow using Supabase Auth invite links and Brevo transactional email.
- Add a ShadCN dashboard page for user role management.
- Add localization, docs, and focused unit tests.

## Implementation

- `list_user_role_management` returns users with their current roles.
- `assign_user_role` and `remove_user_role` enforce role boundaries in SQL.
- The app service layer mirrors the same checks before calling RPC functions.
- Invites are sent server-side with `SUPABASE_SERVICE_ROLE_KEY` and Brevo API credentials.
- `/[locale]/dashboard/users` is visible only when dashboard access includes `users:manage`.

## Code

- Migration: `supabase/migrations/202606260013_user_role_management.sql`
- API: `app/api/users/manage/route.ts`, `app/api/users/invite/route.ts`, `app/api/users/roles/assign/route.ts`, `app/api/users/roles/remove/route.ts`
- Server layer: `server/controllers/user-management.controller.ts`, `server/services/user-management.service.ts`
- UI: `features/user-management/components/user-invite-form.tsx`, `features/user-management/components/user-role-management-table.tsx`, `app/[locale]/dashboard/users/page.tsx`

## Tests

- `tests/unit/rbac.test.ts`
- `tests/unit/user-management-schema.test.ts`

## Review

Managers can now help operate user access without being able to escalate users to admin or manager. Admins retain full role control.

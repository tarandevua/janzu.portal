# Sprint 3 - RBAC Foundation

> Historical note: the original Manager permissions described below were removed by TASK-201 and DEC-01. The current `instructor` role is relationship-scoped and does not inherit administrative access.

## Goal

Introduce role-based access control for Admin, Manager, Facilitator, and Practitioner.

## Included

- Supabase migration for `users`, `roles`, and `user_roles`.
- Default practitioner role assignment for new Supabase Auth users.
- RLS policies for private user-role visibility.
- Backend repository/service/controller layers for RBAC.
- `GET /api/rbac/me` endpoint.
- Role-aware dashboard redirect and protected role pages.
- ShadCN-style dashboard shell, cards, badges, and buttons.
- Unit tests for role normalization, primary role selection, and permissions.

## Deferred

- Admin role assignment UI.
- Audit log for role changes.
- Fine-grained per-resource authorization policies.

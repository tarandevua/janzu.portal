# Instructor supervision contract

`supervision_assignments` preserves pending, active, declined, ended, and cancelled relationships. A partial unique index permits only one active Instructor per Trainee.

## Mutations

- `request_supervision`: Trainee requests a verified Instructor.
- `respond_to_supervision`: selected Instructor accepts or declines.
- `end_supervision`: either participant or an Administrator ends/cancels a relationship.
- `admin_assign_instructor`: Administrator performs a reasoned direct assignment or transfer.

Every RPC validates `actor_user_id = auth.uid()`. A Trainee cannot activate a relationship. Accepting a transfer ends the prior active relationship before activating the next relationship in the same transaction. Audit records and in-app notifications preserve every decision.

Instructors can read only active assigned Trainee profile/training information and feedback summaries. Participant contact data and feedback free text are masked.

## Instructor dashboard read model

`list_instructor_supervision_dashboard(actor_user_id)` returns one row per active assignment owned by the authenticated Instructor. It exposes only the Trainee display name, derived verified level, verified-training record count and latest record ID, certification journey/session progress, and the latest submitted feedback ID, session date, and rating.

The function binds `actor_user_id` to `auth.uid()`, requires the `instructor` role, and filters by the caller's active assignments. It never returns Session Participant identity, contact fields, session notes, feedback free text, or private evidence. Losing the active assignment removes the row immediately. The UI uses the returned source IDs only to build links whose destinations re-check authorization.

Migration `202608260001_task_203_instructor_supervision_dashboard.sql` is additive and has no backfill. Remediation must use a later forward migration that replaces or revokes the function.

# Sprint 12 - Notifications

## Goal

Introduce database-backed notifications so practitioners and managers can see important workflow events inside the dashboard.

## Tasks

- Add the `notifications` table with RLS, indexes, and typed notification events.
- Create database triggers for feedback, location approval, event RSVP, and certification progress.
- Add REST endpoints for listing notifications and marking a notification read.
- Add a ShadCN-based dashboard notification inbox.
- Add English and Spanish localization.

## Implementation

- Notifications are private to `notifications.user_id`.
- Domain events are generated in PostgreSQL triggers so server actions and REST APIs share the same notification behavior.
- Feedback events are inserted with their metadata in one statement and are idempotent by feedback record.
- Dashboard links are stored without locale, then localized in the UI when rendered.
- The dashboard inbox is server-rendered and uses a server action for read state updates.
- Legacy feedback notifications receive an exact link only when the timestamp match is one-to-one and unambiguous.

## Code

- Migration: `supabase/migrations/202606260011_create_notifications.sql`
- TASK-001 verification migration: `supabase/migrations/202608140001_verify_feedback_notifications.sql`
- API: `app/api/notifications/route.ts`, `app/api/notifications/read/route.ts`
- Server layer: `server/controllers/notification.controller.ts`, `server/services/notification.service.ts`, `server/repositories/notification.repository.ts`
- UI: `app/[locale]/dashboard/notifications/page.tsx`, `features/notifications/components/notification-list.tsx`

## Tests

- `tests/unit/notification-schema.test.ts`
- `tests/unit/task-001-migration.test.ts`
- `supabase/tests/task_001_feedback_notifications.sql`

## Review

The notification system now supports the required trigger categories except explicit event invitations, which need a future invitations workflow before they can be emitted meaningfully.

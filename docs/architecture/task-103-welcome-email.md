# TASK-103 welcome email architecture

The welcome email is a narrow delivery slice for `welcome.activated`; it does not implement the reusable event outbox assigned to TASK-502.

## Request flow

1. A member accepts a localized invitation or signs in through the localized auth callback.
2. Supabase establishes an authenticated server session and redirects to the dashboard.
3. The dashboard layout verifies the user with `auth.getUser()`.
4. A server-only service calls `claim_welcome_email_delivery` with the verified user ID and route locale.
5. PostgreSQL locks the member, records first activation, snapshots locale and verified roles, and returns at most one delivery attempt.
6. Next.js `after()` sends the localized email without delaying the dashboard response.
7. A service-role-only result function records provider acceptance or a sanitized retry/permanent failure.

## Failure and remediation

The migration is forward-only. If deployment must be remediated, disable the application call while retaining delivery history, correct configuration or template code, and replay the same delivery ID after its retry time. Do not delete or recreate accepted delivery rows because that would defeat lifetime idempotency.

Provider acceptance is intentionally distinguished from confirmed delivery. Verified provider webhooks and a general delivery worker belong to TASK-502.

# TASK-502 transactional email architecture

One immutable `transactional_email_events` row fans out to private `transactional_email_deliveries`. Unique event and recipient-delivery keys make source retries, concurrent enqueue calls, worker retries, and Administrator replay idempotent. `transactional_email_attempts` records safe operational outcomes without message bodies or recipient contact data.

The forward-only migration adds the event, delivery, attempt, and preference tables; typed event/preference/status enums; indexes for recipient history, provider callbacks, and due work; RLS; and service-role-only enqueue, claim, result, and webhook functions. No existing event emitter is changed by this task. `welcome.activated` retains its TASK-103 table and trigger because DEC-06 explicitly keeps that narrow slice separate.

## Authorization and privacy

- Source services derive recipients after their authorized domain transition; no public route accepts a recipient.
- Members manage only their own optional preferences and may read only their own delivery summaries.
- Administrators may inspect events, deliveries, and safe attempts for operational support, but cannot mutate them through the authenticated database role.
- Worker and webhook HTTP boundaries use separate long bearer secrets and service-role database functions.
- Templates render only localized fixed copy, recipient greeting, and an allow-listed authenticated portal link. Event metadata is not rendered.

Every destination is relative to the configured portal origin and must identify the exact record and locale defined by DEC-06. The destination page remains responsible for current ownership, role, and relationship authorization; the email link grants no access.

## Failure and remediation

The worker distinguishes provider acceptance from verified delivery. Network, rate-limit, server, deferred, and soft-bounce outcomes reuse the same row and follow the approved backoff. Every provider submission uses the durable delivery UUID as Brevo's idempotency key, and an abandoned `sending` lease is reclaimed after ten minutes. Invalid, blocked, spam, hard-bounce, unsubscribe, validation, and configuration failures become permanent.

To remediate a deployment, disable the scheduler, retain all outbox rows, correct configuration or code, and resume claims. Do not delete or recreate delivery rows. Reversing the schema is intentionally not automated because it would destroy operational and idempotency history.

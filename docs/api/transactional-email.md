# Transactional email infrastructure

TASK-502 implements the reusable outbox contract from DEC-06. Later workflow tasks call the server-only `enqueueTransactionalEmail` service after their source transition commits; browsers cannot enqueue, claim, replay, or mutate delivery state.

## Internal processing endpoint

`POST /api/internal/email/process` claims up to ten due deliveries with `FOR UPDATE SKIP LOCKED`, sends the typed localized template, and records provider acceptance or a normalized failure. It requires `Authorization: Bearer <EMAIL_WORKER_SECRET>` and is intended for a private scheduler. Repeated calls reuse the original delivery and its database-unique idempotency key.

Retryable failures are scheduled after approximately 1 minute, 5 minutes, 30 minutes, 2 hours, and 12 hours, with six total attempts. Permanent provider rejection is not retried.

## Brevo webhook

`POST /api/webhooks/brevo` requires the bearer token configured as `BREVO_WEBHOOK_SECRET` in both the portal and the Brevo transactional webhook. Configure the webhook as unbatched and subscribe to `delivered`, `softBounce`, `deferred`, `hardBounce`, `blocked`, `spam`, `invalid`, and `unsubscribed`. The handler matches the normalized provider message identifier and records delivered, retryable, or permanent state. Payload email addresses, subjects, and provider preview links are neither stored nor logged.

Brevo supports bearer authentication on webhook configuration; configure it rather than placing a secret in the URL.

## Preference boundary

Signed-in members can read and update only their own optional family preferences through Settings. RLS binds every row to `auth.uid()`. Required access, authorization, certification, certificate, and role emails have no opt-out setting. A disabled optional family creates a durable `suppressed` delivery instead of a failure.

## Enqueue contract

The internal service requires a stable event type, immutable event key, safe scalar metadata, server-derived recipient, locale snapshot, exact localized portal record path, recipient delivery idempotency key, and required/preference behavior. It rejects external links, non-record destinations, auth tokens, and metadata keys associated with feedback text, notes, evidence, reasons, contact details, email addresses, signatures, or tokens.

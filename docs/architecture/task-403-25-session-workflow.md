# TASK-403: 25-session workflow

## Outcome

The first DEC-02-compliant 25-session attainment creates one immutable milestone record. The source transaction fans out one localized in-app notification and one required transactional email to the Trainee and the active Instructor captured at attainment. Database uniqueness on `(journey_id, milestone)`, notification `event_key`, email event key, and recipient idempotency key makes recalculation and retries safe.

## Readiness contract

Reaching 25 sessions does not approve Level 2. A Trainee may create a readiness request only while all server-derived conditions hold: verified Level 1, at least 25 counted sessions, and an active Instructor assignment. The request is bound to that assignment. Only that active assigned Instructor can approve, reject, or require revision. Rejection and revision require a reason, which remains in the protected portal record and is excluded from email metadata.

`level_2_readiness_requests` preserves every request and decision. `level_2_readiness_audit` is append-only. Direct client writes are revoked; actor-bound security-definer RPCs compare the supplied actor with `auth.uid()`. RLS permits the Trainee, their current active Instructor, and Administrators to read the workflow.

## Recalculation

Session, training, and assignment triggers continue to rebuild the journey from source records. A participant-confirmed session is derived from submitted feedback rather than the optional `client_id`, so an unnamed but confirmed Session Participant still counts. If verified Level 1, the 25-session threshold, or the active assignment disappears, pending or approved readiness is marked `invalidated` and audited. Reattainment permits a new request but never emits the milestone a second time. A verified Level 2 record advances only when an approval exists under the current active assignment.

## Delivery and privacy

Milestone and decision email metadata contains safe identifiers, counts, timestamps, state, and a next-action code. Decision reasons, evidence, Session Participant data, and feedback are not copied. Email links are localized, identify the exact journey, Trainee, or decision, and rely on the certification page and database authorization checks rather than granting access themselves.

## Operations

Apply `202608270002_add_task_403_notification_types.sql` and then `202608270003_task_403_25_session_workflow.sql` after TASK-402 and TASK-502 migrations. The workflow migration backfills one attainment event for each currently eligible journey. Email remains in the durable outbox until the TASK-502 worker processes it. Remediation is forward-only: correct source session/training/assignment data and recalculate; do not delete audit, attainment, notification, or email history.

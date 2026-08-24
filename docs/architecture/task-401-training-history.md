# TASK-401 structured training history

## Vertical slice

The training-history slice contains:

1. `training_history` records for Level 1 and Level 2 claims.
2. `training_history_audit` before-and-after snapshots for submission, correction, and review.
3. RLS plus authenticated read/review functions.
4. Typed repository and service models.
5. Server actions for submission, correction, approval, and rejection.
6. A localized English/Spanish workspace with loading, empty, success, validation, and failure states.
7. English and Spanish knowledge-base guidance.

## Authorization and privacy

- A Trainee reads and submits only their own records.
- Only the active assigned Instructor or an Administrator reads another Trainee's records.
- Only the active assigned Instructor or an Administrator reviews a claimed record.
- An ended assignment immediately removes Instructor read and review access.
- Actor-bearing security-definer functions require `actor_user_id = auth.uid()`.
- Evidence references and notes are private and are not included in public/community profile projections, notifications, email, or logs.
- Verifier display data is returned only inside the authorized read model. The audit record retains the immutable verifier user ID and assignment ID.

The current level is derived from verified records. Claimed and rejected records cannot advance it. TASK-402 remains responsible for Level 2 eligibility and the wider certification state machine.

## Historical-recognition boundary

DEC-04 historical recognition requires a two-person process and additional evidence, conflict, appeal, and aggregate-session models. An ordinary TASK-401 claim is not historical approval and must not activate historical status. This task does not invent the later workflow.

## Migration

`202608240001_task_401_training_history_read_model.sql` adds an authorized read function without changing existing records. It is forward-only and has no backfill. If remediation is needed, deploy another migration that replaces or revokes the function.

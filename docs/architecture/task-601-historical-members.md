# TASK-601 historical member import and verification

## Accepted boundary

DEC-04's 2026-09-07 clarification stores verified professional recognition and defers role activation to TASK-104. This feature never assigns trusted roles, creates assessments/certificates, changes contact consent, or opts members into maps.

The import deliberately matches existing accounts. Use the existing invitation flow first when an account is missing. Evidence is represented by restricted references and external signed-declaration references; this task does not add a file store or public evidence links. Administrators designate qualified senior reviewers per claim with an audited reason. Reviewer role membership remains required on every read and review. Supervision assignment alone grants no historical-evidence access.

## Data and state

`historical_member_claims` stores permanent source/key identity, the original import payload, the current details/status/revision, reviewer decisions and approved total. `historical_member_events` stores immutable snapshots at import and every designation, recusal, revision, or decision. Restrictive foreign keys preserve history. RLS and column grants restrict reads; all writes use actor-bound RPCs.

A global transaction advisory lock serializes import commits and historical review mutations. Commit also takes a shared table lock on users so concurrent identity changes or case-variant inserts cannot invalidate the duplicate check before mutation. This bounded operator workflow favors correctness over bulk throughput. Preview is read-only. Every batch is fully checked before mutation. Exact replays emit no new audit/notification events. Optimistic revisions protect decisions; retries after a successful mutation must reload instead of submitting a new decision. Evidence/contact content is excluded from operational error logs.

A historical training approval creates or updates a linked canonical training record. Two independent decisions remain in the historical audit. Ordinary single-reviewer training actions and direct owner edits cannot approve or alter imported training. Correction/recusal/reassignment rejects the linked canonical projection until verification completes again. The original import stays immutable even as a claim is revised.

Historical aggregate totals remain separate from sessions. The canonical recalculation uses `task_601_count_sessions`: approved totals whose full covered period follows verified Level 1, plus qualifying native sessions outside those periods. Approved historical periods cannot overlap for the same member. Native sessions entered later within an approved historical period do not add credit; this is a conservative deduplication rule. A partially supported aggregate does not estimate unsupported credit from later native records within its covered period. Narrow/correct the aggregate period through review if necessary. No individual historical sessions are invented.

Changing a claim invokes the existing canonical recalculation, including readiness invalidation and idempotent milestone delivery. Changing/removing qualifying Level 1 evidence makes historical totals ineligible. Certification/assessment lifecycle behavior after assessment remains governed by existing TASK-404/405 rules; this task does not silently revoke an issued certificate.

## Migration and remediation

Apply, in order:

1. `202609070002_add_historical_claim_notification.sql` (enum addition in its own committed migration).
2. `202609070003_task_601_historical_members.sql` (private claims/events, training link and guard, actor-bound RPCs, source count extension).

There is no member import, grant, visibility change, or historical backfill on migration. Existing source/session behavior remains the same with zero historical claims. The normal training-review implementation is preserved under a revoked internal function and wrapped to exclude historical claims. The canonical training read model gains an additive `historical_claim_id` field so the UI links to historical review and suppresses ordinary correction/review controls.

Do not rewrite deployed migrations or delete audited evidence to undo an import. Submit a correction/dispute through the workflow to remove active credit; review amended evidence independently. Repair implementation defects using a new forward migration. Disable the new route/actions if operational containment is needed, preserving claims, source keys and audit tables. TASK-602 must exercise representative corrections before production rollout.

## Validation

See `supabase/tests/task_601_historical_members.sql` for executable database integration coverage and `tests/unit/historical-members*` for contract, service and UI tests. Validation results and environment limitations are recorded in the TASK-601 planning note.

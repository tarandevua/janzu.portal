# TASK-701 audit logging implementation and validation

Date: 2026-09-14. Status: **Planned** — existing workflow audit history has been inventoried, but DEC-08 retention and deletion decisions are not yet approved.

## Goal

Provide one privacy-safe, server-authorized way for Administrators to review immutable audit history for role changes, supervision, training verification, profile visibility, Learning Alliance acknowledgement, certification overrides, assessment decisions, and certificate lifecycle.

## Status checklist

- [ ] DEC-08 authorization and privacy decisions accepted.
- [ ] Retention and deleted-user behavior approved.
- [ ] Definition of Ready satisfied and roadmap status set to Ready.
- [ ] Forward-only database migration complete.
- [ ] Typed server and UI vertical slice complete.
- [ ] English and Spanish complete.
- [ ] Automated and browser validation complete.
- [ ] Final diff and documentation reviewed.
- [ ] Roadmap status set to Verify with repository evidence.
- [ ] Migrated-environment verification complete.
- [ ] Definition of Done satisfied and roadmap status set to Done.

## Readiness review

- TASK-701 has no task dependency; it is extended alongside every sensitive workflow.
- The working tree was clean when the readiness review began.
- Audit persistence already exists for every category named in the roadmap, but schemas, maintained types, privileges, retention behavior, and read paths are inconsistent.
- There is no TASK-701 migration, SQL integration test, architecture/API contract, or unified Administrator audit route.
- Several existing audit tables are absent from `types/database.ts`.
- Manual role changes record the actor but currently use a generic reason rather than a supplied business reason.
- Some existing foreign keys cascade deletion of audit history. No retention or deleted-user policy approves changing that behavior.
- DEC-08 remains Proposed. TASK-701 does not satisfy the Definition of Ready until its open approval items are resolved.

## In scope

- [ ] Preserve existing workflow audit tables as authoritative sources.
- [ ] Add a normalized, Administrator-only, actor-bound audit read function.
- [ ] Standardize application-role read/write privileges and append-only behavior.
- [ ] Require and record reasons for manual role assignment and removal.
- [ ] Implement the approved retention and deleted-user policy without rewriting deployed migrations.
- [ ] Add indexes for category/date, actor/date, subject/date, and stable cursor pagination where required.
- [ ] Update maintained TypeScript database types.
- [ ] Add typed model, repository, service, and server boundary.
- [ ] Add an Administrator-only audit page and navigation.
- [ ] Add English and Spanish copy and knowledge-base guidance.
- [ ] Add unit, SQL integration/security, and browser coverage.
- [ ] Add architecture, API, migration, and remediation documentation.

## Out of scope

- Bulk audit export or deletion UI.
- External SIEM or analytics integration.
- Operational monitoring and alerting owned by TASK-703.
- Broad user-journey end-to-end coverage owned by TASK-702.
- Adding audit categories unrelated to the roadmap list.
- Editing already deployed migrations.

## Authorization rules

- [ ] Only a current authenticated Administrator can query the unified audit read model.
- [ ] The database binds `actor_user_id` to `auth.uid()` and rejects substituted actors.
- [ ] Anonymous, non-Administrator, and deleted-account requests are rejected server-side.
- [ ] Application roles cannot insert, update, or delete audit rows directly.
- [ ] Existing subject/participant access to individual workflow history is preserved but not broadened.
- [ ] Every deep link re-checks authorization at its destination.

## Data and privacy rules

- [ ] Unified results use only the allowlist accepted in DEC-08.
- [ ] Feedback text, private notes, contacts, evidence, reasons, signatures, tokens, storage paths, and raw snapshots are excluded.
- [ ] Retention duration, legal hold, and deleted-user handling match the accepted policy.
- [ ] Logs and error responses contain only safe identifiers, event type, outcome, and normalized failure codes.
- [ ] No audit content is public or included in email/notification text.

## Acceptance criteria

- [ ] Every named sensitive workflow produces one normalized event after a successful committed transition.
- [ ] Failed or rolled-back transitions produce no event.
- [ ] Idempotent retries do not create duplicate business events.
- [ ] Each event contains a stable ID, category, action, occurred-at timestamp, safe actor and subject references, and applicable state transition.
- [ ] Manual role changes require a reason and preserve the authenticated Administrator actor.
- [ ] Unified results never contain a prohibited field or raw protected payload.
- [ ] Category, action, actor, subject, date-range, and cursor filters execute server-side.
- [ ] Anonymous, unrelated, former-relationship, non-Administrator, deleted-account, and actor-tampering cases are rejected as applicable.
- [ ] Direct insert, update, and delete attempts against audit history fail for application roles.
- [ ] Existing audit records and source workflows remain valid after forward migration.
- [ ] The Administrator page provides localized loading, empty, success, failure, forbidden, filter, pagination, and safe-deep-link behavior.
- [ ] English and Spanish desktop and mobile layouts have no blocking overflow or accessibility issue.

## Implementation sequence

1. [ ] Resolve and accept every DEC-08 open approval item.
2. [ ] Change TASK-701 in the roadmap from Planned to Ready.
3. [ ] Add a timestamped forward-only migration; do not edit deployed migrations.
4. [ ] Add the normalized read contract, privilege hardening, role-change reason contract, retention behavior, and indexes.
5. [ ] Update `types/database.ts` from the resulting schema.
6. [ ] Add repository, service, and authenticated server boundary.
7. [ ] Add the Administrator audit page, navigation, and all UI states.
8. [ ] Add English and Spanish dictionaries and knowledge-base articles.
9. [ ] Add unit tests and `supabase/tests/task_701_audit_logging.sql`.
10. [ ] Add English/Spanish desktop/mobile browser verification.
11. [ ] Add `docs/api/audit-log.md` and `docs/architecture/task-701-audit-logging.md`.
12. [ ] Run the complete validation checklist and review the final diff.
13. [ ] Record evidence below and move the roadmap status to Verify.
14. [ ] Apply and verify the migration in the target environment.
15. [ ] Mark Done only after every checklist and migrated-environment check passes.

## Validation checklist

- [ ] Forward migration succeeds against representative existing data.
- [ ] Reapplying supported idempotent setup creates no duplicate audit data.
- [ ] `supabase/tests/task_701_audit_logging.sql` passes.
- [ ] Relevant existing workflow SQL regression suites pass.
- [ ] Unit tests for normalization, redaction, authorization results, cursor pagination, and localization parity pass.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] English desktop and mobile browser scenarios pass.
- [ ] Spanish desktop and mobile browser scenarios pass.
- [ ] Keyboard access, focus, labels, and mobile overflow pass.
- [ ] `git diff --check` passes and final diff contains only TASK-701 work.

## Repository baseline

- `npm run lint` — pass on 2026-09-14.
- `npm run typecheck` — pass on 2026-09-14 when run serially after the production build.
- `npm test` — 70 files and 241 tests pass on 2026-09-14.
- `npm run build` — pass on 2026-09-14.
- These checks establish the pre-implementation baseline only. They are not TASK-701 completion evidence.

## Verification evidence

Not yet available. When repository implementation is complete, record the migration name, automated test counts, SQL security scenarios, browser viewports/locales, final-diff result, and any environment limitations here before moving to Verify.

## Deployment and remediation

- Apply only new forward migrations in timestamp order, followed by the matching application deployment.
- No destructive audit backfill or cleanup is permitted without the accepted DEC-08 retention policy.
- Repair schema, privilege, or projection defects with later forward migrations while preserving existing history.
- Repository completion does not imply deployment completion. Keep the task in Verify until authenticated migrated-environment checks pass.

## Risks and assumptions

- Existing raw audit snapshots can contain protected workflow data and must never be returned by the unified projection.
- Current cascade behavior may conflict with the eventual retention policy; no change is authorized while DEC-08 is Proposed.
- Current per-workflow RLS behavior is intentionally different and must not be flattened into broader access.
- Service-role and operational database access remain deployment concerns outside ordinary portal authorization.

## Follow-up

- TASK-702 — broader critical end-to-end journeys.
- TASK-703 — operational monitoring, alerting, and unauthorized-access-attempt aggregation.

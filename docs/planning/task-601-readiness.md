# TASK-601 implementation and validation

Date: 2026-09-07. Status: **Verify** — repository implementation complete; deployment and an authenticated journey in the migrated portal remain to be verified.

## Readiness and approved scope

The working tree was clean before work began. TASK-201, TASK-401 and TASK-402 were marked Done and their role/supervision, training and certification implementations were inspected. No existing member import workflow existed; `import-supabase.sh` is database restoration tooling.

The initial readiness review identified the boundary between DEC-04 historical recognition and DEC-02/DEC-07 certificate-based activation. The stakeholder explicitly selected **Store verified recognition; defer role activation**. This is recorded in DEC-04 and the TASK-104 scope. No product or authorization decision remains unresolved for this implementation.

The importer matches existing accounts, supports private training/session-total/professional claims, and requires two-person verification. It never creates accounts, trusted roles, assessments, certificates, contact consent, or public map visibility. Imported historical session totals remain aggregates. Reviewer designation is per claim, with an audited senior-qualification reason. Evidence files and signed declarations are retained externally behind restricted references.

## Delivered

- Validation-only preview, all-or-nothing commit, duplicate/ambiguous identity and source conflict reporting, stable source keys, safe exact replay, and concurrency protection.
- Typed server validation, repository/service boundaries, authenticated actor checks, RLS and column-level privacy, no direct claim/event writes.
- Independent senior and Administrator review, conflict recusal, supported partial session totals, append-only corrections/appeals and decision history, immediate recalculation of suspended credit.
- Canonical training integration with a historical source link and protection against ordinary single-reviewer approval/correction; aggregate integration without fictional sessions or overlapping credit.
- English/Spanish portal UI, loading/empty/success/error states, sidebar navigation, exact authorized links, localized in-app decision notice and knowledge-base guides.
- [API contract](../api/historical-members.md), [architecture and remediation](../architecture/task-601-historical-members.md), unit/UI/SQL tests and a repeatable browser fixture.

## Validation evidence

- `npm run lint` — pass.
- `npm run typecheck` — pass.
- `npm test` — 66 files, 231 tests pass.
- `npm run build` — pass.
- `git diff --check` and final review — pass; changes are limited to TASK-601 and its explicitly agreed TASK-104 dependency note.
- `supabase/tests/task_601_historical_members.sql` — pass on isolated PostgreSQL with Supabase auth/role fixtures. Covers dry-run no writes, duplicate/source/identity failures, replay, actor/target tampering, independent verification, self-review rejection, partial totals, overlapping aggregates/native sessions, revoked reviewer access, correction/invalidation, source links, notices, professional recognition without role activation, and anonymous access.
- Independent concurrent-connection check — two simultaneous identical commits produced one claim, one audit event and one replay. Deleted-account RLS also passed.
- Forward-upgrade check with representative pre-existing verified training, a validated native session and a certification journey — preserved existing journey and counted credit; created no historical claims or backfill.
- SQL dependency regression suites TASK-401, TASK-402 and TASK-404 — pass.
- `tests/browser/historical-members.mjs` — English/Spanish at 1280px and 390px: current-draft validation before commit, invalidation when draft changes, success/authorization-error states, exact localized guide links, keyboard focus, no overflow or JavaScript errors. Mobile screenshot visually inspected. Component actions use a deterministic test fixture; database behavior is verified separately by SQL tests.
- Actual local production routes `/en/dashboard/historical-members` and `/es/dashboard/historical-members` redirect anonymous browsers to the corresponding login route.

To rerun the browser fixture, make Playwright available through the normal module path or `PLAYWRIGHT_MODULE`; optionally set `TASK601_PORTAL_URL` to a local production server for route checks, then run `node tests/browser/historical-members.mjs`. Artifacts are written to the OS temporary directory under `task601-browser`.

## Existing issues found, preserved outside this task

- `202607030005_practitioner_location_notes.sql` adds `note`, already created by an earlier migration. Only this redundant migration was skipped when constructing isolated fresh fixtures; no deployed migration was edited. Existing-deployment migration history must be checked before rollout.
- The TASK-403 SQL regression fails its active-Instructor request-notification count assertion at line 179 both before and after TASK-601. This was reproduced in a separate pre-TASK-601 database. The required unit suite passes; this existing SQL assertion is not reported as passing.
- Existing duplicate `evidenceReference` dictionary keys produce browser-fixture bundler warnings. They were preserved rather than including unrelated localization cleanup.

## Deployment and operational limits

Apply `202609070002_add_historical_claim_notification.sql` in its own committed migration, followed by `202609070003_task_601_historical_members.sql`. No backfill is performed. Deploy the matching application afterward. Historical claims/events are append-only at the audit layer; corrections suspend or amend credit through the authorized workflow. Repair schema defects with new forward migrations, preserving evidence and audit history.

The isolated database uses a minimal Supabase auth/role fixture. A real migrated Supabase environment plus authenticated Administrator, designated reviewer and member browser journeys remains the release verification step. No live data was imported and no production migration was applied.

Historical-period deduplication is conservative: native sessions inside an approved aggregate's covered period do not add extra credit, including when only a minimum total is supported. Correct/narrow the historical period through independent review when necessary. An already-issued certificate is governed by the existing certification lifecycle rather than silently revoked by an import correction.

## Follow-up

- TASK-104 — professional role activation from verified historical recognition, respecting DEC-02/DEC-07.
- TASK-602 — representative veteran pilot, real identity/evidence cases, workload, correction and rollout checks.
- TASK-702 — authenticated end-to-end release verification and reconciliation of the existing TASK-403 SQL notification assertion.

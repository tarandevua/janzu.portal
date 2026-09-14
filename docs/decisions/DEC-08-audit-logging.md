# DEC-08: Audit logging and review

- Status: Proposed
- Proposed date: 2026-09-14
- Implements: TASK-701
- Depends on: DEC-01, DEC-02, DEC-03, DEC-05, and DEC-07

## Context

Sensitive portal workflows already preserve history in separate role, supervision, training, profile-visibility, Learning Alliance, certification, assessment, and certificate tables. The records use different schemas and access policies, and the portal has no single operational review surface. TASK-701 must make that history consistently immutable, privacy-safe, and reviewable without copying protected workflow content into a less restrictive store.

## Proposed decisions

### Source of truth and review model

- Existing workflow-specific history tables remain the source of truth. TASK-701 does not copy or backfill them into a second mutable event store.
- An authenticated, actor-bound database function provides a normalized, paginated read model across the approved audit sources.
- The unified review model is available only to Administrators. Existing subject and active-participant access to workflow-specific history remains unchanged and is not broadened by TASK-701.
- The review model returns a stable event identifier, category, action, occurred-at timestamp, safe actor and subject identifiers/display labels, previous/resulting state where applicable, and an allow-listed authorized destination.
- Filters are server-side and limited to category, action, actor, subject, and date range. Pagination uses a deterministic timestamp-and-ID cursor.

### Authorization and immutability

- Every unified audit request binds its supplied actor identifier to `auth.uid()` and verifies the current Administrator role in the database.
- Anonymous users, non-Administrators, deleted accounts, and callers that substitute another actor identifier receive no audit data.
- Application roles cannot insert, update, or delete audit history directly. Audit events are written only by approved database triggers or actor-bound workflow functions in the same transaction as the source transition.
- A failed or rolled-back source transition creates no audit event. Idempotent workflow retries must not create duplicate business events.
- Manual role assignment and removal require a reason that is preserved in protected history. Automatic certificate-derived role transitions use their certificate lifecycle event as the reason/source.

### Data minimization

- The unified review model never returns feedback free text, participant contact data, training notes or evidence, assessment notes or remediation details, administrative reasons, authentication tokens, Learning Alliance content or signatures, certificate files, storage paths, signature assets, or raw before/after JSON snapshots.
- Reasons and evidence remain available only through their existing, separately authorized workflow records when policy permits.
- Display labels are current convenience fields, not immutable identity evidence. Stable identifiers and event timestamps remain authoritative.
- Audit data is never public and is not copied into email, notifications, client logs, analytics, or operational error messages.

### User interface and export

- The portal provides an Administrator-only audit page with localized English and Spanish category/action labels, filters, pagination, and loading, empty, authorization, and retry states.
- Deep links open only existing authorized portal records and re-check authorization at the destination.
- Bulk export, audit deletion, legal-hold administration, external security-information-and-event-management integration, and monitoring/alerting are outside TASK-701.

### Retention and account deletion

- A retention schedule must be approved before this decision can be accepted or TASK-701 can be marked Ready.
- Until that approval, TASK-701 must not add destructive cleanup jobs or silently change existing foreign-key deletion behavior.
- The approved policy must specify retention duration by event category, legal-hold behavior, and whether deleted-user identifiers are retained, nulled, or pseudonymized while preserving event integrity.
- Retention or erasure must not rewrite an event's action, state transition, occurrence time, or protected source reference.

## Acceptance consequences

- TASK-701 requires a forward-only migration, maintained database types, a typed server read boundary, an Administrator UI, English and Spanish copy, SQL authorization/privacy tests, unit coverage, browser verification, API and architecture documentation, and migrated-environment verification.
- Raw audit-table access is not a substitute for the normalized review contract.
- TASK-702 owns broader end-to-end user journeys. TASK-703 owns monitoring, alerting, and unauthorized-access-attempt aggregation.

## Open approval items

- [ ] Approve Administrator-only unified review access.
- [ ] Approve the safe field allowlist and prohibited-field list.
- [ ] Approve required reasons for manual role assignment and removal.
- [ ] Approve the retention duration for each audit category.
- [ ] Approve deleted-user pseudonymization and legal-hold behavior.
- [ ] Confirm that bulk export remains out of scope.

## Rejected alternatives

- Copying every existing record into a new general-purpose table is rejected because it duplicates sources of truth and increases privacy and consistency risk.
- Returning raw JSON snapshots is rejected because current training and certification history can contain notes, evidence references, and other protected workflow data.
- Relying on hidden navigation or client-side role checks is rejected because audit authorization must be enforced in the database and server boundary.
- Treating application logs as the audit record is rejected because logs do not provide transactional completeness, stable authorization, or controlled retention.

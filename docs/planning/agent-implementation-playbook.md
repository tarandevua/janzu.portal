# Agent Implementation Playbook

## Purpose

This playbook defines how agents should implement tasks from the [User Feedback Roadmap](./user-feedback-roadmap.md). It is intended to reduce duplicated work, unsafe schema changes, incomplete vertical slices, and ambiguous handoffs.

## 1. Definition of Ready

An agent may begin implementation only when:

- The task has a stable objective.
- All listed dependencies are complete.
- Required product decisions are recorded.
- Privacy and authorization behavior is explicit.
- Acceptance criteria are testable.
- The task can be completed as one coherent vertical slice.

If any of these conditions is missing, the agent should document the blocker instead of inventing policy.

## 2. Standard task brief

Every assigned task should contain:

```md
# TASK-ID: Short title

## Objective
One measurable outcome.

## Context
Existing behavior and reason for the change.

## In scope
- Explicit implementation items.

## Out of scope
- Related work intentionally deferred.

## Dependencies
- Required decisions, migrations, or tasks.

## Authorization rules
- Who can read, create, update, approve, or delete.

## Data and privacy rules
- Visibility, retention, consent, and audit requirements.

## Acceptance criteria
- Observable outcomes written as pass/fail statements.

## Validation
- Unit, integration, browser, migration, and security checks.
```

## 3. Required implementation sequence

For each task, work in this order:

1. Inspect relevant routes, components, services, repositories, types, migrations, tests, and documentation.
2. Confirm the task does not overlap uncommitted user work.
3. Record assumptions and identify policy gaps.
4. Design the data contract and authorization rules.
5. Add a forward-only database migration when required.
6. Update generated or maintained TypeScript database types.
7. Implement repository and service behavior.
8. Implement server actions or API boundaries.
9. Implement UI and empty/error/loading states.
10. Add English and Spanish localization.
11. Add unit and integration coverage.
12. Update API, architecture, and knowledge-base documentation.
13. Run the complete validation checklist.
14. Review the diff for unrelated changes.
15. Hand off with migrations, risks, and follow-up tasks clearly identified.

## 4. Vertical-slice rule

A feature is not complete when only its UI exists. A normal vertical slice includes:

- Database schema or verified reuse of existing schema
- Row-level security and server authorization
- Typed repository model
- Service rules
- Server action or API boundary
- User interface
- English and Spanish copy
- Loading, empty, success, and failure states
- Audit behavior where sensitive
- Automated tests
- Documentation

Avoid creating placeholder buttons or messages for workflows that do not exist.

## 5. Database migration rules

- Use additive, timestamped, forward-only migrations.
- Never rewrite an already deployed migration to change production behavior.
- Preserve existing data unless an approved migration explicitly transforms it.
- Make backfills deterministic and idempotent.
- Add indexes for new query paths.
- Define foreign-key deletion behavior deliberately.
- Enforce important invariants in the database where practical.
- Update RLS policies whenever new data paths are introduced.
- Test migrations against representative existing data, not only an empty database.
- Document rollback or remediation when a migration is not trivially reversible.

For internal terminology such as `manager`, `apprentice`, and `clients`, do not rename database identifiers as part of unrelated UI work. Identifier migrations require a dedicated compatibility plan.

## 6. Authorization and privacy rules

- UI visibility is not authorization.
- Every sensitive operation must be checked in the service or database layer.
- Prefer least privilege.
- Instructor access must be scoped to assigned Trainees.
- Session Participant records and feedback are private by default.
- Public, community-only, Instructor-only, Administrator-only, and private visibility must be distinguishable in data access rules.
- Contact data must never become public through a default value or migration.
- Consent must include actor, timestamp, policy version, and revocation behavior.
- Security-definer database functions must validate the supplied actor against the authenticated user or be callable only through trusted server boundaries.

Authorization tests should include:

- Expected access for each permitted role
- Rejection for unrelated users
- Rejection for anonymous users
- Rejection when a relationship has ended
- Protection against changing an actor or target identifier in the request

## 7. Role implementation rules

- Separate display labels from persisted identifiers.
- Do not assume Facilitator implies Instructor.
- Do not assume Instructor implies Administrator.
- Support multiple roles only when the permission merge is explicitly tested.
- Record who assigned or removed a role and why.
- Migrations from legacy roles must document the before/after permission matrix.

## 8. Certification workflow rules

- Certification must be a state machine, not a collection of unrelated booleans.
- State transitions must be explicit, validated, and auditable.
- Derived counts must be recalculable from source sessions.
- Removing or invalidating a session must not leave stale eligibility.
- Notifications and emails must be emitted from idempotent transition events.
- Manual overrides require a reason and authorized actor.
- Certificate issuance must occur only after the final approved state.
- Role activation and certificate issuance should be transactional.

## 9. Notification and email rules

Each event must define:

- Stable event type
- Idempotency key
- Recipient rules
- Localized title and body
- Exact authorized destination
- Required metadata snapshot
- Whether it is mandatory or preference-controlled
- Retry behavior
- Delivery and failure status

Do not put sensitive feedback text in email. Email should summarize the event and link to the authenticated portal record.

## 10. Localization rules

- Update English and Spanish in the same change.
- Preserve dictionary key parity.
- Do not hardcode visible role or workflow text in components when it belongs in translations.
- Format dates, times, and numbers using the active locale.
- Verify long Spanish labels on mobile layouts.
- Update knowledge-base articles when workflow behavior changes.

## 11. UI implementation rules

- Lead users toward the next valid action.
- Provide useful empty states rather than blank panels.
- Display why an action is unavailable.
- Preserve filters and pagination in links where relevant.
- Deep links must open the exact authorized record.
- Provide loading, success, validation, authorization, and retry states.
- Avoid adding a dashboard summary without a path to the underlying record.
- Verify keyboard access, focus behavior, labels, and mobile overflow.

## 12. Testing strategy

### Unit tests

Cover:

- Validation schemas
- Permission calculations
- State-transition rules
- Idempotency keys
- Derived progress calculations
- Localization key parity

### Repository and integration tests

Cover:

- RLS and role boundaries
- Relationship-scoped access
- Migration backfills
- Duplicate-event prevention
- Session invalidation and progress recalculation
- Transactional role/certificate behavior

### Browser tests

Cover the complete user journey for:

- New Trainee onboarding
- Instructor assignment
- Session creation and feedback
- Exact notification deep link
- Profile visibility
- Certification milestones
- Assessment and certification

### Regression checks

At minimum run:

```sh
npm run lint
npm run typecheck
npm test
```

Run a production build and relevant browser tests for routing, server rendering, localization, or layout changes.

## 13. Observability requirements

Important workflows should produce structured logs or operational records containing safe identifiers, event type, outcome, and failure reason.

Never log:

- Feedback free text
- Private notes
- Authentication tokens
- Learning Contract signatures
- Full contact data unless explicitly protected and necessary

Monitor repeated failures, duplicate events, stuck state transitions, email delivery failures, import conflicts, and authorization denials.

## 14. Documentation requirements

Update the appropriate documentation in the same task:

- `docs/api/` for API contracts
- `docs/architecture/` for system design
- `docs/decisions/` for product and technical decisions
- `content/knowledge-base/en/` for English user guidance
- `content/knowledge-base/es/` for Spanish user guidance
- `docs/planning/` for roadmap status and dependencies

Do not expose internal role identifiers in user documentation unless needed for technical reference.

## 15. Definition of Done

A task is done only when:

- Acceptance criteria pass.
- Authorization and privacy rules are enforced.
- Migration and backfill behavior are verified.
- Types and documentation match the implementation.
- English and Spanish are complete.
- Loading, empty, success, and error states exist.
- Audit behavior is implemented where required.
- Lint, type checking, and tests pass.
- Relevant browser behavior is verified.
- No unrelated user changes were overwritten.
- Remaining risks and follow-up tasks are documented.

Repository completion does not imply deployment completion. A task that requires migrations remains in Verify status until it has been exercised in a migrated environment.

## 16. Agent handoff format

Use this format at the end of every task:

```md
## Outcome
What is now working.

## Changed
- Main files, migrations, and behavior.

## Authorization and privacy
- Rules implemented and verified.

## Validation
- Commands and browser scenarios run.

## Migration/deployment notes
- Order, backfills, environment requirements, and rollback/remediation.

## Remaining risks
- Known limitations or assumptions.

## Follow-up
- Explicit task IDs only; do not silently expand scope.
```

## 17. Change-management rules

- Keep one primary outcome per pull request.
- Avoid mixing terminology cleanup with role-schema migration.
- Avoid combining privacy changes with unrelated profile redesign.
- Do not introduce a second implementation of an existing workflow.
- Rebase or coordinate before modifying files owned by another active task.
- Review migrations and permission changes more strictly than visual changes.
- Use feature flags when deploying incomplete multi-stage workflows would expose unusable actions.
- Update roadmap status only after validation evidence exists.

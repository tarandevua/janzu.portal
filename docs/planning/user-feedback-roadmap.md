# Janzu Portal User Feedback Roadmap

## Purpose

This roadmap converts user feedback into ordered, independently verifiable implementation work. It distinguishes completed repository work, decisions that must be approved before implementation, and engineering tasks that are ready for execution.

Use this roadmap together with [Agent Implementation Playbook](./agent-implementation-playbook.md).

## Status definitions

| Status  | Meaning                                                                             |
| ------- | ----------------------------------------------------------------------------------- |
| Done    | Implemented and verified in the repository. Deployment may still need confirmation. |
| Verify  | Implemented, but must be tested against a migrated environment.                     |
| Blocked | A product, privacy, or certification decision is required.                          |
| Ready   | Requirements and dependencies are sufficiently defined.                             |
| Planned | Depends on earlier work.                                                            |

## Work already completed

| ID      | Outcome                                                                                                          | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| DONE-01 | Visible `Apprentice` terminology changed to Trainee.                                                             | Done   |
| DONE-02 | Visible `Manager` terminology changed to Instructor.                                                             | Done   |
| DONE-03 | Visible `Client` terminology changed to Session Participant.                                                     | Done   |
| DONE-04 | English and Spanish terminology updated without renaming internal database tables, routes, or role values.       | Done   |
| DONE-05 | Portal roles documented in the English and Spanish knowledge base.                                               | Done   |
| DONE-06 | Obsolete feedback “next sprint” placeholder removed.                                                             | Done   |
| DONE-07 | Feedback notifications contain participant name, session date, rating, unread state, and an exact feedback link. | Done   |
| DONE-08 | Exact feedback links open the corresponding feedback detail panel.                                               | Done   |

## Important current constraints

- Internal `manager` still represents the visible Instructor role.
- Internal `apprentice` still represents the visible Trainee role.
- Instructor currently inherits the former Manager permissions.
- There is no Instructor–Trainee assignment model.
- Certification currently centers on one validated-session threshold rather than a complete Level 1, Level 2, Level 3, and assessment journey.
- Profile visibility is not yet a complete field-level privacy system.
- Transactional email is not yet implemented for the full lifecycle.

## Required product decisions

These decisions must be recorded under `docs/decisions/` before dependent implementation begins.

### DEC-01: Role model

Decide:

- Whether Practitioner is a role, certification stage, or community label.
- Whether `manager` remains the internal Instructor identifier or is migrated later.
- Which permissions belong to Instructor.
- Whether a person can hold multiple roles.
- Whether a Trainee can have one or multiple active Instructors.

### DEC-02: Certification rules

Decide:

- Requirements for completing each training level.
- Requirements for unlocking Level 2.
- Requirements for unlocking assessment.
- Which sessions count toward each milestone.
- Who can approve readiness, assessment, and certification.
- How reassessment, revocation, and manual overrides work.

### DEC-03: Profile and map privacy

Decide:

- Which roles may appear publicly.
- Which roles appear only to authenticated community members.
- Whether exact coordinates or only city/region are shown.
- Which profile fields can be public, community-only, or private.
- Whether WhatsApp can ever be public.

### DEC-04: Historical member verification

Decide:

- Who verifies veteran members.
- What evidence is required.
- Whether historical session totals can be imported.
- How conflicting or incomplete records are handled.

## Ordered implementation plan

### Stage 0 — Release and decision gates

#### TASK-001: Verify completed feedback and terminology work

**Status:** Done
**Priority:** P0  
**Dependencies:** None

**Outcome:** Confirm that the latest migrations and UI changes work in a migrated test environment.

**Acceptance criteria:**

- New feedback creates one notification with participant name, session date, rating, and exact record link.
- The exact link opens only feedback the signed-in user is authorized to read.
- English and Spanish display the approved terminology.
- Existing notification backfill does not associate the wrong feedback record.

**Verification:** Migration `202608140001_verify_feedback_notifications.sql` and its SQL integration test verify one-notification idempotency, exact-link authorization, and conservative one-to-one legacy matching. English and Spanish dictionary parity and approved terminology are covered by unit tests and the localized session guidance.

#### TASK-002: Approve and record DEC-01 through DEC-04

**Status:** Done
**Priority:** P0  
**Dependencies:** Stakeholder approval

**Outcome:** Eliminate policy ambiguity before schema and authorization work begins.

### Stage 1 — Immediate usability

#### TASK-101: Add First Steps onboarding

**Status:** Done
**Priority:** P1  
**Dependencies:** DEC-01, DEC-02

**Scope:**

- Persistent onboarding checklist.
- Learning Alliance acknowledgement step.
- Profile completion and visibility step.
- Training-history step.
- Instructor selection step.
- Calendar, session, and feedback guidance.
- English and Spanish knowledge-base content.

**Acceptance criteria:**

- A new Trainee sees a clear next action after first sign-in.
- Completion state persists across devices.
- The guide remains accessible after completion.
- Every checklist item links to a real action or guide.

**Verification:** First Steps derives persistent progress from versioned Learning Alliance events, field-level profile visibility, structured training records, active supervision, and guide completion. English and Spanish routes remain accessible after completion.

#### TASK-102: Add calendar guidance

**Status:** Done

**Priority:** P1  
**Dependencies:** None

**Scope:** Explain Quick Add, calendar views, recurring slots, booking states, cancellation behavior, visitor visibility, and time zones.

**Acceptance criteria:**

- Contextual guidance appears beside the calendar.
- Full English and Spanish articles match current behavior.
- Desktop and mobile instructions are verified.

**Verification:** The availability calendar now includes a localized, responsive guidance panel linked to matching English and Spanish knowledge-base articles. Automated tests cover dictionary parity, article scope, visitor privacy, booking and cancellation states, time zones, and localized routes. Browser verification covers the adjacent desktop panel, stacked mobile panel, mobile Week-view scrolling, and the authenticated route boundary.

#### TASK-103: Send a welcome email

**Status:** Verify
**Priority:** P1  
**Dependencies:** TASK-101, TASK-501

**Acceptance criteria:**

- The message is sent once after invitation acceptance or first activation.
- It includes role, First Steps link, certification overview, privacy explanation, and support path.
- It uses the user’s preferred language.
- Delivery status and failures are recorded.

**Verification:** Migration `202608150010_welcome_email_delivery.sql` atomically records first activation, preferred locale, one lifetime idempotency key, provider acceptance, and bounded retry/permanent failure states. The authenticated dashboard boundary derives the member server-side, service-role-only functions mutate delivery state, and localized English/Spanish templates include role, First Steps, certification, privacy, and support guidance. Unit tests cover the migration contract and both templates; `task_103_welcome_email.sql` covers migrated idempotency, locale, retries, status, and function grants.

#### TASK-104: Add a professional role-claim workflow

**Status:** Planned  
**Priority:** P1  
**Dependencies:** DEC-01, DEC-04, TASK-201

**Acceptance criteria:**

- Existing professionals can request Facilitator or Instructor recognition.
- Users cannot grant themselves trusted roles.
- Administrators can approve, reject, or request more information.
- Decisions and supporting evidence are auditable.

### Stage 2 — Roles and supervision

#### TASK-201: Implement real Instructor authorization

**Status:** Verify
**Priority:** P1  
**Dependencies:** DEC-01

**Scope:** Define and enforce the Instructor permission matrix in database policies, server services, navigation, dashboards, and tests.

**Acceptance criteria:**

- Instructors cannot manage unrelated users or global settings unless explicitly authorized.
- Authorization is enforced server-side, not only hidden in the UI.
- Existing Manager accounts migrate without accidental privilege gain or loss.
- Permission tests cover every role and sensitive action.

**Verification:** Forward-only migrations replace `manager` with `instructor`, remove inherited administrative permissions, bind actors to authenticated users, and scope supervision data to active assignments.

#### TASK-202: Add Instructor–Trainee assignment

**Status:** Done
**Priority:** P1  
**Dependencies:** TASK-201

**Scope:** Request, accept, decline, transfer, end, and administratively assign supervision relationships.

**Acceptance criteria:**

- A Trainee cannot silently assign an Instructor.
- An Instructor sees only assigned Trainees.
- Current and historical assignments are preserved.
- Assignment events generate in-app notifications and audit records.

**Verification:** Request, accept, decline, transfer, end, and administrative assignment RPCs preserve history, enforce one active Instructor, and emit audit and notification records.

#### TASK-203: Add an Instructor supervision dashboard

**Status:** Done  
**Priority:** P1  
**Dependencies:** TASK-202, TASK-401, TASK-402

**Acceptance criteria:**

- Assigned Trainees show current level, verified training, session progress, recent feedback, milestone, and next action.
- Every summary links to its source records.
- Session Participant information is minimized to what supervision requires.

### Stage 3 — Profiles, maps, and contact privacy

#### TASK-301: Add complete profile visibility controls

**Status:** Done
**Priority:** P1  
**Dependencies:** DEC-03

**Acceptance criteria:**

- Users can understand and change permitted visibility settings.
- Public queries never return private or community-only fields.
- Visibility changes take effect immediately and are audited.
- Safe defaults are applied to new and existing profiles.

**Verification:** Profiles use private-by-default field audiences, separate public/community projections, verified-role public eligibility, and no exact-coordinate projection.

#### TASK-302: Separate public and community maps

**Status:** Done
**Priority:** P2  
**Dependencies:** TASK-301

**Acceptance criteria:**

- Anonymous users see only approved public professionals.
- Authenticated community members see only fields allowed for community visibility.
- Map role/category comes from verified platform state.
- Users can preview their public and community views.

**Verification:** Forward-only migration `202608260003_task_302_separate_practitioner_maps.sql` adds distinct anonymous and actor-bound community map projections plus an owner-bound preview. All projections derive categories from verified platform state, apply field audiences, omit exact coordinates and private notes, and emit deterministic 0.1-degree city/region grid-cell centers. SQL integration tests cover public/community authorization and privacy; unit and browser checks cover localized maps, previews, route boundaries, filtering, and responsive layout.

#### TASK-303: Add WhatsApp with explicit consent

**Status:** Done
**Priority:** P2  
**Dependencies:** DEC-03, TASK-301

**Acceptance criteria:**

- WhatsApp is never exposed without separate affirmative consent.
- Visibility can be public, community-only, or private according to approved policy.
- Revoking consent removes the number from all profile and map responses.
- Consent timestamp and policy version are recorded.

**Verification:** Forward-only migration `202608270001_task_303_whatsapp_consent.sql` adds private-default WhatsApp storage, an owner-bound and actor-checked consent RPC, protected consent audit history, and community-only profile/map projections. Public contracts have no WhatsApp field; revocation atomically clears the current number. English/Spanish UI, knowledge-base guidance, SQL integration tests, and unit coverage are included. Migrated-environment verification remains required.

### Stage 4 — Training and certification

#### TASK-401: Add structured training history

**Status:** Done
**Priority:** P1  
**Dependencies:** DEC-02, DEC-04

**Required data:** Level, cohort, location, dates, Instructor, verification status, verifier, evidence, and notes.

**Acceptance criteria:**

- Current level is derived from verified records.
- Unverified claims cannot unlock certification.
- Corrections preserve an audit trail.
- Trainees, assigned Instructors, and Administrators receive appropriate access.

**Verification:** Level 1/2 claims, relationship-scoped verification, derived verified level, correction/review audit snapshots, RLS, UI, and localized guidance are implemented.

#### TASK-402: Implement a certification state machine

**Status:** Done
**Priority:** P1  
**Dependencies:** TASK-401

**Suggested states:**

1. Level 1 in progress
2. Level 1 completed
3. Practicum in progress
4. Twenty-five validated sessions reached
5. Eligible for Level 2 review
6. Level 2 completed
7. Advanced practicum in progress
8. Fifty validated sessions reached
9. Assessment available
10. Assessment in progress
11. Revision required or passed
12. Certification approved
13. Facilitator activated

**Acceptance criteria:**

- Users cannot skip required states.
- State transitions are rule-driven and idempotent.
- Manual overrides require authorization, reason, and audit entry.
- Existing certification records migrate safely.

**Verification:** The canonical journey enum, rule-driven source recalculation, adjacent and idempotent transitions, Administrator-only documented overrides, private audit history, relationship-scoped RLS, legacy-safe backfill, localized UI, and automated coverage are implemented. Migrated-environment verification remains required.

#### TASK-403: Add the 25-session workflow

**Status:** Verify
**Priority:** P1  
**Dependencies:** TASK-202, TASK-402, TASK-502

**Acceptance criteria:**

- Trainee and assigned Instructor receive one notification and email.
- “Request Level 2 review” becomes available only when requirements are satisfied.
- Level 2 is not approved automatically.
- Session invalidation recalculates eligibility safely.

**Verification:** Forward-only migrations `202608270002_add_task_403_notification_types.sql` and `202608270003_task_403_25_session_workflow.sql` add immutable milestone attainment, one localized in-app notification and required email per recipient, assignment-bound readiness requests and Instructor decisions, protected audit history, exact authorized links, and recalculation-driven invalidation. English/Spanish UI and knowledge-base guidance, unit coverage, and SQL integration coverage are included. Migrated-environment verification remains required.

#### TASK-404: Add the 50-session assessment workflow

**Status:** Planned  
**Priority:** P1  
**Dependencies:** TASK-402, TASK-502

**Acceptance criteria:**

- All training and practice requirements are checked.
- Trainee, Instructor, and authorized Administrator are notified once.
- The assessment queue records assessor, date, outcome, notes, and revisions.
- Failed or incomplete assessments have an explicit next action.

#### TASK-405: Issue digital certificates and activate Facilitator

**Status:** Planned  
**Priority:** P2  
**Dependencies:** TASK-404

**Acceptance criteria:**

- Certificate issuance requires authorized assessment approval.
- Certificate number is unique and verifiable.
- Issuance, role activation, and map classification update atomically.
- Replacement and revocation preserve history.
- The member can download the certificate and receives it by email.

### Stage 5 — Notifications and email

#### TASK-501: Define the notification event matrix

**Status:** Done
**Priority:** P1  
**Dependencies:** DEC-01, DEC-02

**Events:** Welcome, session registered, booking request, feedback received, session validated, Instructor assignment, 25-session milestone, Level 2 decision, 50-session milestone, assessment state, certification, certificate, and role changes.

**Deliverable:** For each event, document recipients, channel, required data, destination link, localization, preference behavior, and idempotency key.

**Verification:** Accepted decision `DEC-06-notification-event-matrix.md` defines the stable event types, server-derived recipients, channel and preference behavior, safe metadata, exact authorized destinations, English/Spanish locale rules, idempotency keys, delivery states, and retry expectations for every listed event family.

#### TASK-502: Build transactional email infrastructure

**Status:** Verify
**Priority:** P1  
**Dependencies:** TASK-501

**Acceptance criteria:**

- Templates are typed and localized.
- Duplicate events cannot send duplicate email.
- Failures are recorded and retryable.
- Sensitive feedback text is not embedded in email.
- Links target authorized portal records.

**Verification:** The forward-only outbox migration, service-role-only enqueue/worker/webhook boundaries, typed English/Spanish templates, private optional preference management, retry attempts, delivery states, automated coverage, and operational documentation are implemented. Repository validation and isolated migrated-database SQL/RLS verification pass; deployment migration and provider configuration remain operational steps.

### Stage 6 — Veteran community onboarding

#### TASK-601: Build historical member import and verification

**Status:** Planned  
**Priority:** P2  
**Dependencies:** TASK-201, TASK-401, TASK-402

**Acceptance criteria:**

- Import supports validation-only dry runs.
- Duplicate identities are reported before mutation.
- Every historical claim records its source and verification state.
- Trusted roles require verification.
- Re-running the import is safe.

#### TASK-602: Run a veteran-member pilot

**Status:** Planned  
**Priority:** P2  
**Dependencies:** TASK-601

**Acceptance criteria:**

- A representative small cohort completes the process.
- No duplicate accounts are created.
- Missing-data cases and verification workload are documented.
- Correction and rollback procedures are tested before full rollout.

### Stage 7 — Cross-cutting quality

#### TASK-701: Add audit logging

**Status:** Ready  
**Priority:** P1  
**Dependencies:** None; extend with every sensitive workflow

**Audit:** Role changes, supervision, training verification, visibility, agreement acceptance, certification overrides, assessment decisions, and certificate lifecycle.

#### TASK-702: Add critical end-to-end tests

**Status:** Planned  
**Priority:** P1  
**Dependencies:** Implement incrementally

**Journeys:** New Trainee onboarding, Instructor assignment, feedback validation, exact notification link, milestones, assessment, certification, map privacy, and veteran role claim.

#### TASK-703: Add operational monitoring

**Status:** Planned  
**Priority:** P2  
**Dependencies:** Event-producing workflows

**Monitor:** Email failures, duplicate events, invalid state transitions, import conflicts, unmatched feedback notifications, stuck onboarding, and unauthorized access attempts.

## Recommended execution order

1. TASK-001 — Verify the current release.
2. TASK-002 — Approve product decisions.
3. TASK-101 and TASK-102 — Improve onboarding and calendar guidance.
4. TASK-201 — Correct Instructor authorization.
5. TASK-202 — Add Instructor–Trainee assignment.
6. TASK-301 — Implement profile privacy.
7. TASK-401 — Add training history.
8. TASK-402 — Add certification state transitions.
9. TASK-501 and TASK-502 — Establish notification and email infrastructure.
10. TASK-403 and TASK-404 — Add milestone workflows.
11. TASK-203 — Add Instructor supervision dashboard.
12. TASK-104 — Add professional role claims.
13. TASK-302 and TASK-303 — Add map separation and consent-based WhatsApp.
14. TASK-405 — Add certificate issuance and Facilitator activation.
15. TASK-601 and TASK-602 — Import veteran members.

TASK-701, TASK-702, and TASK-703 are cross-cutting and must be implemented alongside the workflows they protect.

## Parallelization boundaries

Safe parallel work after product decisions:

- First Steps content and calendar guidance
- Instructor authorization design and notification event documentation
- Profile privacy UX design and historical import specification
- Audit infrastructure and automated test scaffolding

Do not implement these pairs independently in parallel:

- Role migration and Instructor–Trainee assignment
- Training-history schema and certification state machine
- Notification schema and milestone triggers
- Profile visibility schema and map queries
- Assessment approval and certificate issuance

These pairs share data contracts and require one coordinated owner or sequential delivery.

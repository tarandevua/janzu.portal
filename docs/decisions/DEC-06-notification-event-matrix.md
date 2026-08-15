# DEC-06: Notification event matrix

- Status: Accepted
- Decision date: 2026-08-15
- Implements: TASK-501
- Depends on: DEC-01, DEC-02

## Context

Portal workflows need one approved contract for deciding who receives a notification, which channel is used, what data may be copied into the event, where the notification links, and how duplicate delivery is prevented. This decision defines that contract without implementing the transactional email infrastructure tracked by TASK-502.

## Common contract

### Event creation and authorization

- A domain event is created only after its source transition commits successfully.
- The server or database derives recipients from authenticated ownership, active supervision, assigned assessment, or Administrator authorization. A client must never supply or override a recipient identifier.
- One immutable event record fans out to recipient deliveries. Each delivery is private to its recipient.
- In-app records are inserted in the source transaction where practical. Email is sent from a durable outbox only after commit.
- An email link never grants access. Every destination must re-check authentication, role, ownership, and active relationship server-side. A recipient who has since lost access is redirected to their dashboard with no record data disclosed.
- Administrator manual replay reuses the original event and idempotency key. It does not create a new business event.

### Localization

- Every event stores a recipient-locale snapshot of `en` or `es` when its delivery rows are created.
- The source is the recipient's persisted account preference. Activation persists the supported invitation or sign-in locale when no preference exists. Missing or invalid values fall back to `en`.
- Templates, subjects, titles, bodies, role labels, dates, and destination paths are rendered in that locale. Stored role identifiers are never exposed as user-facing labels.
- Changing language affects future events and manual re-renders, but does not mutate an already delivered message.
- English and Spanish template keys must have parity before an event type can be enabled.

### Channels and preferences

- `In-app` is mandatory for every authenticated workflow event in the matrix except `welcome.activated`, which is email-only.
- `Required email` cannot be disabled because it confirms account access, trusted authorization, certification, or certificate state.
- `Optional email` defaults on and may be disabled per event family. Disabling it never suppresses the in-app record.
- Preferences are evaluated when a delivery row is created. A suppressed optional email is recorded as `suppressed`, including the preference key, and is not treated as a failure.

### Idempotency and delivery

- Event type names below are stable API identifiers. A breaking semantic change requires a new event type or explicit version suffix.
- Every recipient delivery has a unique key in the form shown in the matrix. Uniqueness is enforced in the database, not only in application code.
- Email states are `pending`, `sending`, `provider_accepted`, `delivered`, `retry_scheduled`, `failed_permanent`, or `suppressed`. Provider acceptance is not reported as delivery; a verified provider webhook records final delivery or bounce.
- Retryable provider or network failures use the same delivery and idempotency key, with attempts after approximately 1 minute, 5 minutes, 30 minutes, 2 hours, and 12 hours. Validation errors, invalid recipients, opt-out suppression, and permanent provider rejection are not retried automatically.
- Each attempt records safe identifiers, attempt number, timestamps, provider message identifier when available, outcome, and a normalized failure code. It must not record authentication tokens, contact data beyond the protected recipient address, feedback text, private notes, evidence, or assessment notes.

### Destination convention

The matrix shows paths as `/{locale}/...`. The delivery renderer substitutes the recipient-locale snapshot. Record identifiers may be placed in a route segment or an allow-listed query parameter. The destination must select the exact authorized record rather than a similar record inferred from timestamps.

## Approved event matrix

| Event family | Stable event type and trigger | Recipients | Channels and preference | Required safe data | Exact destination | Delivery idempotency key |
| --- | --- | --- | --- | --- | --- | --- |
| Welcome | `welcome.activated` when a portal account completes invitation acceptance, or on the first successful authenticated activation if it was pre-created. Restoration, another sign-in, and role changes do not retrigger it. | The activated member. | Required email; no in-app copy. | User ID, display name, verified role-label snapshot, locale, activation timestamp, template version. No token or invitation URL is stored in the event. | All roles: `/{locale}/dashboard/knowledge-base/getting-started/first-steps`. A Trainee email also links to `/{locale}/dashboard/first-steps`. The localized welcome guide is the support path. | `welcome.activated:{userId}:v1` |
| Session registered | `session.registered` after a session record commits. | The member who owns and registered the session. No Session Participant email is generated. | In-app plus optional email `session_updates`. | Session ID, owner user ID, session date, duration, and non-sensitive location label. Exclude private notes and participant contact data. | `/{locale}/dashboard/sessions?sessionId={sessionId}` | `session.registered:{sessionId}:{recipientUserId}` |
| Booking request | `booking.requested` after a request to a verified, bookable Facilitator commits. | The requested Facilitator. Instructors without Facilitator access are not recipients. | In-app plus optional email `booking_requests`. | Request ID, Facilitator user ID, requester display name, requested date/window, and creation timestamp. Contact details and free-text message remain in the authorized portal record. | `/{locale}/dashboard/sessions?tab=requests&requestId={requestId}` | `booking.requested:{requestId}:{recipientUserId}` |
| Feedback received | `feedback.received` on the first submitted transition of one feedback record. | The session owner. | In-app plus optional email `feedback_updates`. | Feedback ID, session ID, participant display name, session date, numeric rating when supplied, and submission timestamp. Email excludes feedback free text and participant contact data. | `/{locale}/dashboard/feedback?feedbackId={feedbackId}` | `feedback.received:{feedbackId}:{recipientUserId}` |
| Session validated | `session.validated` when a session first becomes counted through participant confirmation or authorized Instructor verification. Invalidation is a separate `session.validation_removed` transition. | The Trainee/session owner. The validating actor does not receive a copy. | In-app plus optional email `session_updates`. | Session ID, owner user ID, validation method, validator role label when applicable, counted-at timestamp, and resulting counted-session total. Exclude evidence and feedback text. | `/{locale}/dashboard/sessions?sessionId={sessionId}` | `session.validated:{sessionId}:{validationId}:{recipientUserId}` or `session.validation_removed:{validationId}:{recipientUserId}` |
| Instructor assignment | `instructor_assignment.requested`, `.accepted`, `.declined`, `.cancelled`, `.ended`, or `.transferred` after the corresponding audited transition. | Request: selected Instructor. Accept/decline/cancel: Trainee and the other participant when they were not the actor. End: both participants except the actor. Transfer: Trainee, outgoing Instructor, and incoming Instructor. | In-app plus optional email `supervision_updates`. | Assignment ID, Trainee user ID, Instructor user ID, previous/new state, transition timestamp, and transfer assignment ID when applicable. Exclude private handoff or administrative reasons from email. | `/{locale}/dashboard/supervision?assignmentId={assignmentId}` | `instructor_assignment:{assignmentId}:{newState}:{transitionAuditId}:{recipientUserId}` |
| 25-session milestone | `certification.milestone_25_reached` when the DEC-02 counted-session projection first reaches 25 while Level 1 is verified. Recalculation does not create a second attainment event. | The Trainee and their active Instructor at attainment. | In-app plus required email. | Certification journey ID, Trainee user ID, active assignment ID, counted total, milestone timestamp, and next action `request_level_2_review`. | Trainee: `/{locale}/dashboard/certification?journeyId={journeyId}`. Instructor: `/{locale}/dashboard/certification?traineeId={traineeUserId}`. | `certification.milestone_25_reached:{journeyId}:{recipientUserId}` |
| Level 2 decision | `certification.level_2_readiness_approved`, `.rejected`, `.revision_required`, or `.overridden` after an authorized, audited decision. | The Trainee. For an Administrator override, also the active Instructor whose decision is affected. | In-app plus required email. | Journey ID, decision ID, Trainee user ID, decision state, deciding role label, timestamp, and safe next-action code. Reasons and evidence remain in the portal. | `/{locale}/dashboard/certification?decisionId={decisionId}` | `certification.level_2:{decisionId}:{decisionState}:{recipientUserId}` |
| 50-session milestone | `certification.milestone_50_reached` when the DEC-02 counted-session projection first reaches 50 and Level 2 is verified. Recalculation does not create a second attainment event. | The Trainee, active Instructor, and each currently authorized Administrator at attainment. | In-app plus required email. | Journey ID, Trainee user ID, active assignment ID, counted total, milestone timestamp, and next action `request_assessment_readiness`. | Trainee: `/{locale}/dashboard/certification?journeyId={journeyId}`. Instructor/Administrator: `/{locale}/dashboard/certification?traineeId={traineeUserId}`. | `certification.milestone_50_reached:{journeyId}:{recipientUserId}` |
| Assessment state | `assessment.readiness_requested`, `.readiness_approved`, `.readiness_rejected`, `.assessor_assigned`, `.scheduled`, `.revision_required`, `.passed`, `.failed`, or `.remediation_verified` after the audited state transition. | Request: active Instructor. Readiness decision: Trainee. Assignment/schedule: Trainee and assigned Assessor. Result: Trainee, active Instructor, assigned Assessor when not the actor, and authorized Administrators. Remediation verified: Trainee and assigned Assessor. | In-app plus required email. | Assessment ID, journey ID, Trainee user ID, state, active assignment/Assessor IDs as applicable, transition timestamp, and safe next-action code. Exclude notes, evidence, and remediation details from email. | `/{locale}/dashboard/certification?assessmentId={assessmentId}` | `assessment:{assessmentId}:{transitionAuditId}:{newState}:{recipientUserId}` |
| Certification | `certification.approved`, `.suspended`, `.revoked`, `.reinstated`, or `.overridden` after the authorized state transition. | The member, active Instructor, assigned Assessor, and authorized Administrators, excluding the actor unless the member is the actor. | In-app for all recipients. Required email to the member; optional email `certification_decisions` to other recipients. Suspension, revocation, reinstatement, and override emails are required for every affected recipient. | Journey ID, certification decision ID, member user ID, resulting state, effective timestamp, deciding role label, and safe next-action/appeal code. Reasons, evidence, and investigation details remain in the portal. | `/{locale}/dashboard/certification?decisionId={decisionId}` | `certification:{decisionId}:{resultingState}:{recipientUserId}` |
| Certificate | `certificate.issued`, `.replaced`, or `.revoked` after certificate and derived-role changes commit atomically. | The certified member. An authorized operational Administrator may receive an in-app failure event, but not a duplicate success email. | In-app plus required email. Issuance/replacement email links to the authenticated download; revocation email contains no usable certificate attachment. | Certificate ID, member user ID, public certificate number, status, issued/effective timestamp, replacement predecessor ID when applicable, and locale. | `/{locale}/dashboard/certification?certificateId={certificateId}` | `certificate:{certificateId}:{status}:{recipientUserId}` |
| Role changes | `role.assigned` or `role.removed` after the audited role mutation commits. | The target member. The Administrator actor relies on the audit record and action result rather than a notification. | In-app plus required email. | Role audit ID, target user ID, localized role label, action, effective timestamp, and actor role label. Internal role IDs and administrative reason are not rendered in email. | `/{locale}/dashboard` | `role:{roleAuditId}:{action}:{recipientUserId}` |

## Event-family preference keys

The optional email keys are `session_updates`, `booking_requests`, `feedback_updates`, `supervision_updates`, and `certification_decisions` for non-member certification observers. TASK-502 must provide private, authenticated preference management before allowing any optional family to be disabled. Required email is not represented as an opt-out setting.

## Privacy consequences

- Session Participant contact details, feedback free text, session notes, training evidence, assessment notes, administrative reasons, and authentication links are never copied into email event metadata.
- Recipient email addresses and delivery diagnostics are operational data, not public profile data. They are readable only by the recipient where appropriate and authorized operational Administrators.
- Instructor notifications are resolved from the active assignment at event time. A former Instructor receives no future events and loses access to old destinations when the relationship ends.
- Administrator recipient sets are resolved by verified current role state, never by a client-provided list.

## Implementation boundaries

- TASK-103 implements only `welcome.activated`, including persisted preferred locale, idempotency, delivery recording, and its English and Spanish templates.
- TASK-502 implements the reusable outbox, preference, retry, webhook, template, and delivery-status infrastructure needed by later events.
- Each source workflow task implements its own event emission and exact-record destination. Defining an event here does not enable a placeholder notification for a workflow that does not yet exist.

## Rejected alternatives

- Sending welcome email when an Administrator creates an invitation was rejected because the invitation email already covers that stage and may never be accepted.
- Using the most recent sign-in as the welcome trigger was rejected because it can send duplicates.
- Emailing all Instructors or Administrators about every Trainee event was rejected because it violates least privilege and active-assignment scoping.
- Embedding workflow free text in email was rejected because email is not the authorized system of record.

# Certification journey API

Certification is represented by one `certification_journeys` state machine per Trainee practitioner profile. The legacy `certification_progress` rows remain read-compatible during migration, but their mutation RPCs are revoked.

## Current journey

```http
GET /api/certification/progress
Cookie: sb-access-token=<session>
```

Returns the authenticated member's synchronized journey. The response includes the canonical state, DEC-02 counted-session total, verified Level 1/2 record references, readiness request status and availability, next session milestone, and the next non-protected correction state. A practitioner profile is required.

## Authorized journey list

```http
GET /api/certification/journeys
Cookie: sb-access-token=<session>
```

Administrators receive all journeys. Instructors receive only journeys for Trainees with a current active assignment. Former and unrelated Instructors receive no rows. Other roles receive `403`.

## Level 2 readiness

The localized Certification page uses actor-bound server actions backed by these RPCs:

- `request_level_2_readiness(actor_user_id, target_journey_id)` is Trainee-only and returns the existing pending/approved request on an idempotent retry.
- `decide_level_2_readiness(actor_user_id, target_request_id, target_status, target_reason)` accepts `approved`, `rejected`, or `revision_required`. Only the request's currently active assigned Instructor may decide it; rejection and revision require a reason.
- `get_certification_journey_context(actor_user_id, target_trainee_user_id)` returns the journey plus the latest readiness state and server-derived action flags.

Clients cannot choose recipients or write request, audit, milestone, notification, or email-delivery rows directly. Approval records readiness only; it does not mark Level 2 training complete.

## Manual correction

```http
POST /api/certification/override
Content-Type: application/json
Cookie: sb-access-token=<admin-session>

{
  "journeyId": "00000000-0000-0000-0000-000000000000",
  "expectedState": "level_2_review_eligible",
  "resultingState": "level_2_completed",
  "reason": "Correcting an authenticated workflow failure.",
  "evidenceReference": "internal-decision-record-123"
}
```

Only an Administrator can call the server action or RPC. The authenticated actor is bound to `auth.uid()`. Corrections must move exactly one adjacent state, require a reason and evidence reference, and are idempotent when retried after commit. They cannot fabricate `assessment_passed`, `certification_approved`, or `facilitator_activated`.

## Assessment workflow

The localized Certification page uses actor-bound server actions backed by these RPCs:

- `request_assessment_readiness(actor_user_id, target_journey_id)` requires verified Level 1 and Level 2, 50 cumulative validated sessions of at least 60 minutes, an active Instructor, and no current request.
- `decide_assessment_readiness(actor_user_id, target_request_id, approve_request, target_reason)` is restricted to the active assigned Instructor. Rejection requires a private reason.
- `set_assessor_designation(actor_user_id, target_user_id, target_active, target_reason)` is Administrator-only and separately authorizes an Instructor to assess.
- `assign_assessment_assessor(actor_user_id, target_assessment_id, target_assessor_user_id)` is Administrator-only and rejects the Trainee's active Instructor.
- `schedule_assessment`, `record_assessment_outcome`, and `verify_assessment_remediation` enforce assigned-Assessor and active-Instructor boundaries in the database.
- `list_assessment_queue(actor_user_id)` returns server-derived action flags and only records visible to the Trainee, active Instructor, assigned Assessor, or Administrator.

Each failed, incomplete, or revision-required outcome requires an explicit next action. Notes and remediation details remain in the RLS-protected portal record and are excluded from notification/email metadata. Remediation verification creates a new numbered attempt linked to the previous assessment; it never overwrites the original outcome.

## Counting and automatic transitions

A session counts when it belongs to the Trainee's practitioner profile, is represented by the canonical validated projection, lasts at least 60 minutes, and occurs after verified Level 1 completion. Changes to sessions, verified training, or active supervision recalculate eligibility. Forward transitions are recorded one state at a time; invalidated source eligibility records an audited regression.

Automatic source progression stops at `sessions_50_reached`; active-Instructor assessment-readiness approval advances to `assessment_available`. TASK-404 owns assessment through `assessment_passed`.

## Digital certificate lifecycle

The Certification page uses actor-bound server actions backed by these RPCs:

- `list_certificate_workflow(actor_user_id)` returns only the authenticated member's lifecycle or the Administrator queue, including server-derived action flags and the production-template readiness gate.
- `get_certificate_generation_context(...)` is Administrator-only and validates issuance, replacement, or reinstatement before returning the approved private template references needed by trusted server-side generation.
- `issue_certificate(...)` requires an authorized passed assessment, official name, approved artifact metadata, and an active production template. It atomically approves certification, records the certificate, advances the journey, activates certification-derived Facilitator access, updates the legacy projection, audits the transition, and enqueues required delivery.
- `replace_certificate(...)` is Administrator-only, requires a reason, issues a new number, and retains the predecessor as `replaced` without interrupting access.
- `revoke_certificate(...)` is Administrator-only and requires a reason plus evidence reference. It atomically revokes the active certificate, removes only a certificate-derived Facilitator role, and retains private history and visibility preferences.
- `request_certificate_replacement(...)`, `submit_certificate_appeal(...)`, and the Administrator decision RPCs preserve one pending request per lifecycle record. Reinstatement always creates a new certificate.
- `authorize_certificate_download(...)` permits active-certificate download by the member and historical download by an Administrator, recording each access before the private object is streamed.

PDF creation and private-object upload occur on the trusted server before the database transaction. The transaction validates the certificate ID, human-readable random number, object path, artifact checksum and size, template version, and both approved signature checksums. A failed commit triggers best-effort orphan cleanup. Production operations fail without changing state when the template is not fully configured.

## Public verification

```http
GET /{locale}/certificates/verify/{certificateNumber}
```

`verify_certificate(target_certificate_number)` is callable anonymously only for an exact normalized certificate number. It returns status, Practitioner stage, and lifecycle dates. It never returns PDFs, storage paths, signatures, reasons, evidence, assessment data, or workflow participants. A display name appears only when the member independently has a verified public professional role and public directory/display-name visibility.

```http
GET /api/certificates/{certificateId}/download
Cookie: sb-access-token=<session>
```

The download route rechecks authorization in the database, retrieves the private PDF, verifies its byte length and SHA-256 checksum, and returns it with private no-store headers.

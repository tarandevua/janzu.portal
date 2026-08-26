# Certification journey API

Certification is represented by one `certification_journeys` state machine per Trainee practitioner profile. The legacy `certification_progress` rows remain read-compatible during migration, but their mutation RPCs are revoked.

## Current journey

```http
GET /api/certification/progress
Cookie: sb-access-token=<session>
```

Returns the authenticated member's synchronized journey. The response includes the canonical state, DEC-02 counted-session total, verified Level 1/2 record references, next session milestone, and the next non-protected correction state. A practitioner profile is required.

## Authorized journey list

```http
GET /api/certification/journeys
Cookie: sb-access-token=<session>
```

Administrators receive all journeys. Instructors receive only journeys for Trainees with a current active assignment. Former and unrelated Instructors receive no rows. Other roles receive `403`.

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

## Counting and automatic transitions

A session counts when it belongs to the Trainee's practitioner profile, has a Session Participant, is validated, lasts at least 60 minutes, and occurs after verified Level 1 completion. Changes to sessions, verified training, or active supervision recalculate eligibility. Forward transitions are recorded one state at a time; invalidated source eligibility records an audited regression.

This task stops automatic progression at `sessions_50_reached`. TASK-403 implements Level 2 readiness decisions and milestone delivery, TASK-404 implements assessment, and TASK-405 implements approval, certificate issuance, and atomic Facilitator activation.

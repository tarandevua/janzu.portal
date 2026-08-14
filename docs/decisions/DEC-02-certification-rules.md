# DEC-02: Certification rules

- Status: Accepted
- Decision date: 2026-08-14

## Context

The current portal uses a single validated-session threshold. The target product requires a rule-driven certification journey with explicit training, practice, assessment, and approval states.

## Decisions

### Canonical certification journey

The certification journey is:

1. Level 1
2. Twenty-five counted sessions
3. Level 2
4. Fifty counted sessions
5. Assessment
6. Practitioner

Level 3 is not part of this journey.

Detailed completion, unlocking, counting, approval, reassessment, revocation, and override rules remain to be decided below.

### Level 1 completion

Level 1 is complete when all of the following are true:

- The Trainee completed the full official Level 1 training.
- Attendance is recorded for every required training day or module.
- The training record identifies the cohort, dates, location, and teaching Instructor.
- An authorized Instructor verified the training record.
- All mandatory Level 1 coursework is marked complete.

A practice-session threshold is not required merely to complete Level 1.

### Level 2 completion

Level 2 is complete when all of the following are true:

- The Trainee was formally eligible for Level 2 before attending.
- The Trainee completed the full official Level 2 training.
- Attendance is recorded for every required training day or module.
- The training record identifies the cohort, dates, location, and teaching Instructor.
- An authorized Instructor verified the training record.
- All mandatory Level 2 coursework is marked complete.

Completing Level 2 does not reset the Trainee's accumulated session count.

### Unlocking Level 2

Level 2 unlocks only when all of the following are true:

- Level 1 is complete and verified.
- The Trainee has at least 25 sessions that satisfy the approved counting rules.
- The Trainee has an active Instructor.
- The Trainee submitted a Level 2 readiness request.
- The Trainee's active Instructor approved readiness.
- There are no unresolved session-verification disputes that affect eligibility.

Reaching 25 counted sessions creates eligibility to request review; it does not unlock or approve Level 2 automatically.

### Unlocking assessment

Assessment becomes available only when all of the following are true:

- Level 2 is complete and verified.
- The Trainee has at least 50 qualifying sessions in total, including the first 25; the count does not restart after Level 2.
- The Trainee has an active Instructor.
- The Trainee submitted an assessment-readiness request.
- The Trainee's active Instructor approved readiness.
- All mandatory coursework is complete.
- There is no unresolved session-verification dispute that affects eligibility.

Reaching 50 counted sessions creates eligibility to request assessment review; it does not approve, pass, or complete the assessment automatically.

### Sessions that count toward milestones

The same cumulative session pool is used for the 25- and 50-session milestones. A session counts only when all of the following are true:

- It occurred after verified Level 1 completion.
- The Trainee led a completed one-to-one Janzu practice session.
- It lasted at least 60 minutes.
- The participant confirmed it through submitted feedback, or the Trainee's active Instructor verified it using documented evidence.

One delivered session counts as one session regardless of breaks or multiple feedback submissions. Received sessions, observations, demonstrations, assisted sessions, cancelled bookings, duplicates, and group classes do not count.

Sessions beyond the first 25 that occur before Level 2 still count toward the cumulative total of 50. Approved historical imports may count subject to DEC-04.

An invalidated or disputed session stops counting immediately, and milestone eligibility must be recalculated safely.

### Approval authority

Approval authority is divided as follows:

- The Trainee's active Instructor approves Level 2 readiness.
- The Trainee's active Instructor approves assessment readiness.
- An authorized Assessor, represented by an Instructor with a separate assessor designation, decides the assessment result.
- An Administrator verifies the passed assessment and approves final certification issuance.
- Practitioner-stage activation and Facilitator-role activation occur atomically with certificate issuance.

The Assessor must not be the Trainee's active Instructor. Administrators may resolve technical workflow failures, but they must not substitute their judgment for a readiness or assessment decision except through an authorized, documented manual override.

### Reassessment

- A failed or revision-required assessment does not erase completed levels or valid session counts.
- The Assessor records required remediation and a clear next action.
- The active Instructor verifies remediation before reassessment may be booked.
- Reassessment is a new, separately audited assessment. A different authorized Assessor should be used where available.

### Suspension and revocation

- Certification may be suspended while suspected fraud, serious misconduct, issuance error, or invalidated eligibility evidence is investigated.
- Final revocation requires an Administrator's documented decision, notice to the member, and an opportunity to appeal.
- Revocation invalidates the certificate and removes certification-derived Practitioner status and Facilitator access. Historical records remain intact.

### Manual overrides

- Only Administrators may perform manual overrides.
- Every override requires a reason, supporting evidence, previous and resulting state, actor, timestamp, and audit entry.
- An override may correct workflow or data errors when an authentic underlying approval exists, but it cannot fabricate a passed assessment.
- Affected Trainees, Instructors, Assessors, and Administrators receive notifications appropriate to the action.

## Consequences

- Product copy, state machines, schemas, and implementation plans must not introduce a Level 3 state.
- Existing certification progress will require migration into the canonical sequence.
- Certification must be implemented as an auditable state machine whose transitions enforce these rules.
- Certificate issuance and certification-derived role activation must be transactional.
- Session invalidation and certification suspension or revocation must preserve history while recalculating current eligibility and access.

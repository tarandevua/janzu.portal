# DEC-04: Historical member verification

- Status: Accepted
- Decision date: 2026-08-14

## Context

Members trained or practicing before the portal may need verified training, certification, roles, and session history without having platform-native records. Historical recognition must be trustworthy, privacy-preserving, and auditable.

## Decisions

### Verification authority

Historical or veteran-member recognition uses a two-person verification process:

- A designated senior Instructor or Assessor reviews the member's training and professional evidence.
- An Administrator independently checks completeness, records the decision, and activates verified status or roles.
- No reviewer may approve their own claim.
- Reviewers must disclose conflicts of interest and recuse themselves where appropriate.
- Every approval, rejection, and later correction is audited.

### Required evidence

Every historical-member claim requires:

- Verified identity matching the portal account.
- The claimed training level, dates or approximate period, location, cohort if known, and teaching Instructor.
- At least one primary source, such as a certificate, official training roster, organizer record, or direct confirmation from the teaching organization or Instructor.
- A signed declaration that the submitted information is accurate.

When no primary source survives, two independent corroborating sources may be accepted. These may include statements from recognized senior Instructors or Assessors, contemporary correspondence, invoices, event records, photographs, or existing community or organization records.

Certification or Facilitator recognition must also establish that the member passed the assessment or was formally recognized under the historical rules in force at the time. Self-declaration alone is never sufficient.

Evidence must avoid participant or client personal data unless strictly necessary. Retained evidence files and reviewer notes require restricted access.

### Historical session totals

Verified historical aggregate session totals may be imported under these rules:

- The import records a supported aggregate total as of a stated cutoff date; it must not create fictional individual session records.
- The record includes the covered date range, claimed total, approved total, evidence type, calculation method, both reviewers, and decision notes.
- Only the approved total counts toward the 25- and 50-session milestones.
- When evidence supports only a minimum, the approved total is that minimum rather than an estimate.
- Contemporary logs or official records are preferred; credible attestations may support totals under the approved evidence policy.
- Participant identities and sensitive session notes must not be imported.
- Imported totals remain distinguishable from platform-validated sessions and may be corrected or invalidated without deleting history.
- The two-person approval process applies.

### Conflicting or incomplete records

- Claims may be `pending information`, `partially approved`, `approved`, `rejected`, or `disputed`.
- Reviewers approve only the portion supported by evidence. Unsupported training levels, certification, roles, or session totals remain inactive.
- When credible records conflict, reviewers use the most conservative supported result and mark the claim disputed.
- A disputed or incomplete claim cannot unlock a milestone or trusted role based on the unresolved portion.
- Reviewers record every source, discrepancy, rationale, and requested follow-up without overwriting prior evidence.
- The member receives the decision and may submit additional evidence or appeal a rejection or disputed result.
- An appeal is reviewed by a different senior Instructor or Assessor and a different Administrator wherever staffing permits.
- Corrections are append-only and audited. Previously issued status may be suspended while a material dispute is investigated.

## Consequences

- Historical recognition cannot be activated by a single reviewer.
- The system must support reviewer designations, conflict recusals, evidence references, two recorded decisions, and a durable audit trail.
- Historical aggregates must be modeled separately from individual platform-validated sessions while contributing safely to certification totals.
- Partial approvals and disputes must not grant access or advance certification beyond the supported evidence.
- Appeals and corrections must preserve every earlier claim, source, and decision.

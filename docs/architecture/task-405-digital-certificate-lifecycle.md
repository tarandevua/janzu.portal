# TASK-405: Digital certificate lifecycle

## Outcome

An Administrator can turn an authorized passed assessment into one immutable bilingual certificate and certification-derived Facilitator access. The database commits certificate, journey, role, map classification, audit, notification, and email-outbox effects atomically. Replacement, revocation, appeal, and reinstatement retain complete history.

## Authorization and privacy

Every mutation compares the supplied actor with `auth.uid()` inside a security-definer RPC. Only Administrators issue, replace, revoke, or decide appeals. Members may download only their active certificate, request its replacement, and appeal their own revoked certificate. Administrators may download history; each access is audited. Direct authenticated table writes and reads are revoked in favor of least-privilege projections.

Public verification accepts one exact random number and exposes only status, Practitioner stage, lifecycle dates, and an independently public professional display name. It does not expose official names by default, artifacts, paths, signatures, reasons, evidence, or assessment data.

## Artifact boundary

The active template stores issuer and signatory metadata plus private R2 object paths and SHA-256 checksums. The trusted server fetches both PNGs concurrently, verifies them, creates a bilingual PDF with a verification QR code, uploads it to a private immutable path, and passes only validated metadata to the transaction. Download verifies the stored artifact checksum again.

The initial `v1` row is active but deliberately `production_ready = false`. Deployment must upload approved transparent PNG signatures for Maria Ornelas and Iván Gonzáles and update both paths/checksums before issuance becomes available. Test PDFs carry a visible `TEST FIXTURE - NOT VALID` watermark.

## Role and map behavior

`user_roles.source_certificate_id` distinguishes certificate-created Facilitator access from an independent manual role. Revocation deletes only a role row sourced from the revoked certificate. Existing map projections derive classification from verified roles, so activation and removal change classification in the same transaction without changing opt-in or field/location visibility.

## Lifecycle and remediation

- Initial issuance creates one `active` certificate and one active lifecycle per member.
- Replacement creates a new number and immutable PDF, marks the predecessor `replaced`, and transfers any certificate-derived role source.
- Revocation marks the active certificate `revoked`, removes only derived access, disables member download, and enables a private appeal.
- An upheld appeal retains revocation. Reinstatement creates a new active certificate and restores derived access; it never reactivates the revoked artifact.
- If artifact upload succeeds but the database commit fails, the server deletes the unreferenced private PDF. If cleanup fails, the safe object path is logged for operational remediation without private content.

Apply `202608290001_add_task_405_notification_types.sql` before `202608290002_task_405_certificate_lifecycle.sql`. The migration is additive and forward-only. Rollback remediation is to disable the active template and lifecycle actions; issued audit and certificate rows must not be deleted.

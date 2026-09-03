# DEC-07: Digital certificate lifecycle

- Status: Accepted
- Decision date: 2026-08-29

## Context

TASK-405 completes the canonical certification journey after an authorized passed assessment. The workflow must issue a verifiable digital certificate, activate certification-derived Facilitator access, preserve privacy and lifecycle history, and fail safely when the approved certificate template is unavailable.

## Decisions

### Issuance authority and atomic activation

- Only an authenticated Administrator may issue a certificate.
- The journey must be in `assessment_passed`, its passed assessment must still belong to the journey, and the member must have an official full name.
- One idempotent database transaction records certification approval, creates the active certificate, activates the Facilitator role, advances the journey, writes audit history, updates the role-derived map classification, and enqueues required localized notification and email delivery.
- Normal issuance records the Administrator and timestamp but needs no free-text reason. Replacement, revocation, reinstatement, appeal decisions, and manual overrides require documented reasons where specified below.
- Issuance cannot commit unless an immutable certificate PDF has already been generated in private storage from an active approved template.

### Certificate identity and document

- Certificate numbers are non-sequential, cryptographically random, human-readable identifiers such as `JZ-2026-7K9M-X4QP-2D8R`. Database uniqueness is mandatory. Input is normalized for verification.
- The bilingual Spanish/English PDF contains the member's snapshotted official full name, “Certified Janzu Practitioner”, certificate number, original certification date, document issue date, issuer, public verification URL and QR code, and document template version.
- The certificate contains no email, phone, location, Instructor or Assessor identity, assessment notes, evidence, or private workflow text.
- The issuer is `Escuela de Artes Acuáticas`. The initial template contains approved handwritten signatures for Maria Ornelas and Iván Gonzáles, with printed names and no titles.
- Issuer, signatory names, signature checksums, and template version are snapshotted. Later template changes affect only future documents.

### Signature and artifact storage

- Approved transparent PNG signatures and generated PDFs are private objects. Only trusted server-side generation and authorized download boundaries may read them.
- Each certificate stores its immutable object path, SHA-256 checksum, template version, signature checksums, and generation timestamp.
- Issued, replaced, and revoked PDFs are retained for audit. Only the active certificate is normally downloadable by the member. Administrator retrieval of historical artifacts is audited.
- Test fixtures must be visibly non-production and must never be accepted by the production issuance boundary.
- Until both approved production signature assets and checksums are configured, issuance fails without changing certification, roles, maps, notifications, or email.
- Signature asset configuration is an operational deployment step; a signature-management UI is outside TASK-405.

### Verification and privacy

- Verification by exact certificate number is public. It returns only certificate number, lifecycle status, Practitioner stage, original certification date, and applicable issue, replacement, reinstatement, or revocation dates.
- The member's display name may appear only when the same member has already opted into a verified public professional profile with public display-name visibility. Official/legal names never become public merely because a certificate exists.
- Verification does not expose PDFs, storage paths, signatures, private reasons, workflow participants, or searchable/listable certificate data.

### Portal and email delivery

- The member downloads the active PDF from the authenticated Certification section.
- Required English/Spanish certificate email contains an authenticated portal download link and the public certificate number/verification link. It does not attach the PDF or include assessment details or lifecycle reasons.
- Replaced or revoked documents cannot remain usable through an old email attachment because attachments are never sent.

### Map privacy

- Facilitator activation changes the existing role-derived map classification atomically with issuance.
- Issuance never opts a member into public or community visibility and never changes field-level or location privacy preferences.
- A member already opted into a map is classified as a verified Facilitator immediately. A member who is not opted in remains absent.
- Revocation removes Facilitator classification immediately without changing saved visibility preferences. Exact coordinates remain private.

### Replacement and name changes

- Only an Administrator may replace a certificate, and a reason is mandatory.
- A replacement receives a new certificate number and issue date. The prior certificate becomes `replaced`; it is never edited or deleted. Only one active certificate may exist per member.
- Replacement does not interrupt certification, Facilitator access, or map classification.
- The member's official name is snapshotted. A later profile-name change does not rewrite an issued PDF; the portal warns about the difference and lets the member request Administrator review for replacement.
- Replacements show the original certification date and their own reissue date. Their certificate-number year is the document issue year.

### Revocation, appeals, and reinstatement

- Only an Administrator may revoke. A reason and evidence reference are mandatory.
- Revocation atomically invalidates the active certificate, removes certification-derived Facilitator access and map classification, records history, and sends required localized notice. The private reason is never shown publicly or emailed.
- Normal member download of a revoked PDF is disabled. Public verification shows `revoked` and its effective date.
- A revoked member may submit one pending private appeal at a time with a required reason and optional evidence reference. Later appeals are allowed after a decision, with no fixed deadline.
- Administrators review the private appeal queue. The revoking Administrator cannot decide the appeal when another active Administrator is available.
- Appeal decisions are `upheld` or `reinstated`, require a reason, and are audited. Reinstatement atomically restores certification-derived access and issues a new certificate; it never reactivates the revoked document.
- A reinstatement certificate shows the original certification date and its new reinstatement/issue date.

## Consequences

- Certificate, role, map, audit, notification, and email database changes are transactional, while private artifact creation is a required precondition whose orphan cleanup is safe and documented.
- Public verification is useful outside the portal without becoming a member directory.
- Production deployment of TASK-405 requires two approved signature PNGs plus their configured private object paths and SHA-256 checksums.
- Existing issued artifacts are immutable across name, issuer, signature, branding, and template changes.

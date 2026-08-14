# DEC-03: Profile and map privacy

- Status: Accepted
- Decision date: 2026-08-14

## Context

The portal requires separate public and authenticated-community views. Profile and map responses must enforce field-level visibility, verified role state, location privacy, and explicit contact consent.

## Decisions

### Roles that may appear publicly

- A verified Facilitator may opt into a public professional profile.
- A verified Instructor may opt into a public professional profile.
- An Instructor who is not also a Facilitator must not advertise or accept client-session services through the profile.
- Trainees must not appear publicly.
- Administrator status must not appear publicly.
- Practitioner may appear as a verified certification badge or stage, not as an authorization role.

Public appearance always requires verified platform status and explicit opt-in. A role or certification claim supplied only by the member is insufficient.

### Roles visible to authenticated community members

- A Trainee may opt into the community directory and community map.
- Facilitators and Instructors may opt into community visibility independently of public visibility.
- Verified Practitioner status may appear as a certification badge.
- Administrator status remains hidden except where operationally necessary in an Administrator-only view.

No member appears in either directory by default. Public and community visibility require explicit opt-in, and all displayed role and certification labels must come from verified platform records.

### Map precision

- Public and community maps show only city or region-level locations using an approximate marker or area centroid.
- Exact home or personal coordinates must never be returned through profile or map APIs.
- Exact appointment locations may be shared separately only after a booking is accepted.
- Stored exact coordinates, if needed for distance calculations, remain private and must not be exposed to clients.
- Exact coordinates for a verified professional venue may be considered later under a separate explicit-consent policy; they are outside the scope of this decision.

### Profile field visibility

The maximum permitted visibility for profile and related fields is:

| Field | Maximum visibility |
| --- | --- |
| Display name, profile photo, bio, and languages | Public, community-only, or private |
| Verified professional role and Practitioner badge | Public when the professional profile is public; otherwise community-only or private |
| City, region, and country | Public, community-only, or private |
| Website, booking link, and availability summary | Public, community-only, or private |
| Current training level or stage | Community-only or private |
| Email and ordinary phone number | Community-only with separate consent, or private; never public |
| Legal or official name and login email | Private |
| Exact address and coordinates | Private |
| Active or historical Instructor assignment | Private to the Trainee, relevant Instructor, and authorized Administrators |
| Training evidence, session records, participant or client information, feedback, assessment notes, disputes, and audit history | Private to authorized workflow participants |
| Administrative notes and security or account data | Administrator-only |

Every optional field defaults to private, and members choose visibility separately for each eligible field. Selecting public profile visibility does not automatically expose every public-eligible field. APIs must enforce the maximum visibility above even if stored settings are missing or invalid. Visibility changes take effect immediately and are audited.

### WhatsApp visibility and consent

WhatsApp must never be public.

It may be community-only after the member gives separate, affirmative consent specifically for WhatsApp. It may also remain private and be shared with a requester only after the member accepts a booking or contact request.

Consent records must include the timestamp and policy version. General profile visibility or ordinary phone consent does not imply WhatsApp consent. Consent may be revoked at any time, and revocation must remove the number from all subsequent profile and map responses immediately.

## Consequences

- Anonymous directory and map queries must return only opted-in, verified Facilitators and Instructors.
- Booking capabilities must be derived from verified Facilitator access, not merely from having a public Instructor profile.
- Administrative status and Trainee membership must never leak through public profile or map responses.
- Public and community profile APIs require separate projections so fields above their permitted audience cannot be returned accidentally.
- Location search and maps must use an approved approximation rather than exposing stored personal coordinates.
- Contact consent must be field-specific, versioned, revocable, and auditable.

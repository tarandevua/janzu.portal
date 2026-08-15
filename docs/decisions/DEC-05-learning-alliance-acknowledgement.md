# DEC-05: Learning Alliance acknowledgement

- Status: Accepted
- Decision date: 2026-08-15
- Initial policy version: `2026-08-15-v1`

## Context

First Steps onboarding needs a durable Learning Alliance step. The portal must not present this step as a legal signature or silently turn it into a certification requirement.

## Decision

The Learning Alliance is a non-legal operational acknowledgement. Version 1 asks a Trainee to confirm an intention to:

- Participate respectfully.
- Protect private session and feedback information.
- Communicate boundaries and availability clearly.
- Keep portal records honest.
- Seek support when a safety or relationship concern arises.

Acceptance records the member, actor, locale, policy version, and timestamp. No signature image, typed signature, IP address, authentication token, or agreement free text is stored.

A member may revoke acknowledgement at any time. Revocation creates a new audit event and makes the onboarding item incomplete. It does not delete history, change certification automatically, or block access to unrelated portal features.

Each new policy version requires a new acknowledgement. A previous version never counts as acceptance of a later version.

## Consequences

- Acknowledgement and revocation are append-only audit events.
- The current state is derived from the latest event for the current version.
- The English and Spanish text must convey the same operational commitments.
- Certification rules must not depend on this acknowledgement unless a later approved decision explicitly changes DEC-02 and this decision.

# TASK-101 prerequisite architecture

## Vertical slices

First Steps derives progress from authoritative workflow records:

1. Latest Learning Alliance event for the current version.
2. Profile visibility configuration timestamp.
3. At least one structured training record.
4. One active Instructor relationship.
5. Three persisted guide-completion records.

No checklist item can claim completion for a missing workflow.

## Authorization

- Legacy `manager` data migrates to `instructor`; Instructor no longer receives user, settings, event, location, or global certification permissions.
- Supervision mutations are security-definer functions with authenticated actor binding and relationship invariants.
- Training verification is limited to the active Instructor or Administrator.
- Public and community profile functions return field-filtered projections and never exact coordinates.
- Instructor feedback access returns session date/rating summaries while masking participant identity, contact fields, and free text.

## Migration and remediation

Enum additions are committed in a separate migration before use. Legacy public profiles are set private because the former `is_public` flag cannot prove field-level consent. Members must review the new visibility controls before appearing in a directory again.

The migrations are forward-only. Remediation is another migration; deployed migrations must not be edited or reversed in place.

# DEC-01: Role model

- Status: Accepted
- Decision date: 2026-08-14

## Context

The portal currently uses `practitioner` as a permission-bearing role and uses the internal `manager` identifier for the user-facing Instructor role. The target product model must distinguish authorization roles from training and certification stages.

## Decisions

### Meaning of Practitioner

Practitioner is a certification stage. It is not an umbrella community label or, by itself, a permission-bearing role.

The requirements and workflow for reaching the Practitioner stage will be defined in DEC-02.

### Internal Instructor identifier

The internal `manager` role identifier must be migrated to `instructor` before any further role work begins. The migration must cover stored role data, authorization checks, database policies and functions, application code, tests, and technical documentation.

Existing Manager accounts must retain the intended Instructor access through the migration without accidental privilege gain or loss. A temporary compatibility layer may be used only as part of the migration and must have an explicit removal point.

### Instructor permissions

Instructor is a supervision role with access scoped to assigned Trainees.

An Instructor may:

- View assigned Trainees and the profile, verified training, session progress, feedback summaries, and certification state needed for supervision.
- Accept, decline, transfer, or end their own supervision relationships.
- Verify training and supervised-session records for assigned Trainees.
- Record readiness recommendations and assessment decisions where DEC-02 permits.
- Access an Instructor dashboard and receive supervision notifications.
- Manage their own profile and availability.

Instructor alone does not authorize a person to:

- Manage unrelated users or assign roles.
- Manage global settings.
- View unassigned Trainees or their private client or session data.
- Manage community-wide events.
- Approve public map locations.
- Issue or revoke certification unless DEC-02 explicitly authorizes it.
- Exercise Facilitator or Administrator capabilities automatically.

### Multiple roles

A person may hold multiple active roles simultaneously. Effective permissions are the union of permissions granted by those roles.

Role composition must not create implied roles: Facilitator does not imply Instructor, Instructor does not imply Facilitator or Administrator, and Administrator does not implicitly establish a supervision relationship.

Every role assignment and removal must be audited. The interface may select a primary dashboard for navigation, but the primary dashboard does not replace or suppress the person's other roles.

### Active Instructor assignment

A Trainee may have exactly one active Instructor at a time. All previous supervision assignments must be retained as history.

Changing Instructors requires an explicit transfer and handoff workflow. The outgoing relationship must end before the incoming relationship becomes active; the system must not create an interval with two active Instructors.

## Consequences

- Authorization must not depend on the Practitioner certification stage unless a later decision explicitly maps that stage to a role or permission.
- Existing uses of the `practitioner` role will require a compatibility and migration plan after the complete role model is approved.
- Dependent role work is blocked until the `manager` to `instructor` identifier migration is complete.
- Existing Manager-era administrative permissions must be removed from the migrated Instructor role unless another approved role grants them.
- Instructor data access must be enforced server-side and at the database-policy layer using active supervision assignments.
- Permission tests must cover supported combinations of active roles, including access gained from their union.
- The data model must enforce no more than one active Instructor assignment per Trainee.
- Verification and readiness actions must record the responsible Instructor and the supervision assignment under which the action occurred.

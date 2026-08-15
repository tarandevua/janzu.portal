# Certification API Examples

## Current certification progress

```http
GET /api/certification/progress
Cookie: sb-access-token=<session>
```

## Approval queue

```http
GET /api/certification/approve
Cookie: sb-access-token=<admin-session>
```

Returns eligible and approved certification candidates for Administrator review. Instructor readiness and Assessor decisions belong to the future DEC-02 state-machine workflow.

## Final approval

```http
POST /api/certification/approve
Content-Type: application/json
Cookie: sb-access-token=<admin-session>

{
  "practitionerId": "00000000-0000-0000-0000-000000000000"
}
```

The legacy endpoint remains Administrator-only. The DEC-02 certification state machine supersedes its single-threshold model and is tracked separately.

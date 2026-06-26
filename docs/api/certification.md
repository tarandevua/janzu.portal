# Certification API Examples

## Current certification progress

```http
GET /api/certification/progress
Cookie: sb-access-token=<session>
```

## Approval queue

```http
GET /api/certification/approve
Cookie: sb-access-token=<admin-or-manager-session>
```

Returns eligible and approved certification candidates for admin or manager review.

## Final approval

```http
POST /api/certification/approve
Content-Type: application/json
Cookie: sb-access-token=<admin-or-manager-session>

{
  "practitionerId": "00000000-0000-0000-0000-000000000000"
}
```

Certification eligibility requires 50 validated sessions. Final approval requires an admin or manager role.

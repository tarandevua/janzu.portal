# Session Requests API

Sprint 13 adds public session requests from practitioner profiles and a private practitioner request queue.

## Create a public session request

```http
POST /api/session-requests
Content-Type: application/json

{
  "practitionerId": "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
  "requesterName": "Mara",
  "requesterEmail": "mara@example.com",
  "requesterPhone": "+1 555 0100",
  "preferredDate": "2026-07-12",
  "message": "I would like to book an introductory session."
}
```

Public and authenticated users can submit requests only to public practitioners.

## List my session requests

```http
GET /api/session-requests
```

Requires authentication. Returns session requests for the signed-in practitioner's profile.

## Review my session request

```http
POST /api/session-requests/review
Content-Type: application/json

{
  "requestId": "81f5b9ac-e081-4af2-a88a-e98dc340d719",
  "status": "accepted"
}
```

Valid statuses are `accepted` and `declined`. RLS and repository filtering prevent practitioners from updating requests that do not belong to them.

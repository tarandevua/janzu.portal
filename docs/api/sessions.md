# Session API Examples

Session records are private to the authenticated practitioner's own profile.

## List sessions

```http
GET /api/sessions
Cookie: sb-access-token=<session>
```

## Create session

```http
POST /api/sessions
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "sessionDate": "2026-06-25",
  "durationMinutes": 90,
  "location": "Barcelona pool",
  "notes": "Client was relaxed and grounded."
}
```

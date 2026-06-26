# Events API Examples

## Public events

```http
GET /api/events
```

Returns published events with RSVP counts.

## Create event

```http
POST /api/events
Content-Type: application/json
Cookie: sb-access-token=<admin-or-manager-session>

{
  "title": "Janzu Retreat",
  "description": "Community retreat.",
  "eventType": "retreat",
  "locationName": "Warm Water Center",
  "latitude": 47.0105,
  "longitude": 28.8638,
  "startsAt": "2026-07-01T10:00:00.000Z",
  "endsAt": "2026-07-03T17:00:00.000Z",
  "capacity": 24,
  "status": "published"
}
```

## Managed events

```http
GET /api/events/manage
Cookie: sb-access-token=<admin-or-manager-session>
```

## RSVP

```http
POST /api/events/rsvp
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "eventId": "00000000-0000-0000-0000-000000000000"
}
```

Capacity is enforced by the database RPC.

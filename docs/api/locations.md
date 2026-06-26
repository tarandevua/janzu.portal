# Locations API Examples

## Public approved locations

```http
GET /api/locations
```

Returns approved locations and associated media metadata.

## My submitted locations

```http
GET /api/locations/me
Cookie: sb-access-token=<session>
```

## Submit a location

```http
POST /api/locations
Content-Type: application/json
Cookie: sb-access-token=<practitioner-session>

{
  "name": "Warm Water Pool",
  "locationType": "pool",
  "description": "Quiet pool suitable for sessions.",
  "latitude": 47.0105,
  "longitude": 28.8638,
  "accessInfo": "Booking required.",
  "photoUrl": "https://example.com/photo.jpg"
}
```

New locations start as `pending`.

## Reviewer queue

```http
GET /api/locations/review
Cookie: sb-access-token=<admin-or-manager-session>
```

## Review a location

```http
POST /api/locations/review
Content-Type: application/json
Cookie: sb-access-token=<admin-or-manager-session>

{
  "locationId": "00000000-0000-0000-0000-000000000000",
  "action": "approve"
}
```

`action` can be `approve` or `reject`.

# Practitioner Profile API Examples

## Current practitioner profile

```http
GET /api/practitioners/me
Cookie: sb-access-token=<session>
```

## Update current practitioner profile

```http
PUT /api/practitioners/me
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "bio": "Janzu practitioner focused on nervous-system restoration.",
  "country": "Spain",
  "city": "Barcelona",
  "latitude": 41.38,
  "longitude": 2.17,
  "languages": ["English", "Spanish"],
  "website": "https://example.com",
  "profileImageUrl": "https://example.com/profile.jpg",
  "isPublic": true
}
```

## Public practitioners

```http
GET /api/practitioners
```

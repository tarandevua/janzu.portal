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
  "profileImageUrl": "https://example.com/profile.jpg"
}
```

Profile content updates do not change visibility. Members configure directory and field audiences separately on the dashboard profile page. The server enforces private, authenticated-community, and public maximums from DEC-03.

## Public practitioners

```http
GET /api/practitioners
```

This endpoint returns only verified Facilitators and Instructors who opted into the public directory. Every field is projected independently. The response omits internal user identifiers, exact coordinates, practice-location notes, visibility configuration, and record timestamps. Authenticated community profiles use the separate `list_community_practitioner_profiles` projection, which binds the requested actor to a signed-in, non-deleted portal member.

Both directory projections currently return city/country labels without map coordinates. Approximate public and community map locations are deferred to TASK-302.

Administrators cannot publish a profile on a member's behalf. They may remove a profile from all directories as an audited safety action; only the member can opt back in through their profile visibility settings.

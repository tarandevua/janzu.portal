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

## Public map markers

`list_public_practitioner_map_markers()` is available to anonymous and authenticated callers. It returns only explicitly public, verified Facilitators and Instructors whose location field is also public.

## Community map markers

`list_community_practitioner_map_markers(actor_user_id)` requires an active authenticated portal member and binds `actor_user_id` to the signed-in user. It returns only profiles and fields allowed for the authenticated community audience. `preview_my_practitioner_map_markers(actor_user_id, target_audience)` is owner-bound and previews the currently saved `public` or `community` result.

All map contracts return only marker ID, profile ID, verified category, audience-filtered display name and image, city/country label, and approximate latitude/longitude. Approximate coordinates are deterministic 0.1-degree grid-cell centers. Exact coordinates, private notes, addresses, user IDs, Administrator status, and audit data are never returned.

Administrators cannot publish a profile on a member's behalf. They may remove a profile from all directories as an audited safety action; only the member can opt back in through their profile visibility settings.

## WhatsApp consent

WhatsApp is configured separately on the authenticated profile page. `update_my_whatsapp_consent(actor_user_id, target_whatsapp_number, target_visibility, affirmative_consent, target_policy_version)` is owner-bound and accepts only `private` or `community` visibility. A grant requires an E.164 international number, affirmative consent, and the current policy version. Revocation requires a null number and `private` visibility, and removes the current number atomically.

Public profile and public map contracts never include a WhatsApp field. The community profile and map projections return `whatsapp_number` only for a current, versioned consent with `community` visibility. Owner profile responses include the private current consent state; audit history is protected by owner/Administrator RLS and never stores the number itself.

# RBAC API Examples

## Current user roles

```http
GET /api/rbac/me
Cookie: sb-access-token=<session>
```

Successful response:

```json
{
  "data": {
    "userId": "00000000-0000-0000-0000-000000000000",
    "roles": ["practitioner"],
    "primaryRole": "practitioner",
    "access": [
      {
        "role": "practitioner",
        "label": "Practitioner",
        "dashboardPath": "practitioner",
        "permissions": ["clients:manage", "profile:manage"]
      }
    ]
  },
  "error": null
}
```

Unauthenticated response:

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Sign in is required."
  }
}
```

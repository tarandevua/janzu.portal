# User Management API

Portal user and role management is Administrator-only. The former Manager identifier and permissions were removed by TASK-201.

## List users

```http
GET /api/users/manage
```

Requires `users:manage`.

Administrators can manage roles. Instructors cannot list unrelated users or assign roles.

## Assign role

```http
POST /api/users/roles/assign
Content-Type: application/json

{
  "userId": "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
  "role": "facilitator"
}
```

## Remove role

```http
POST /api/users/roles/remove
Content-Type: application/json

{
  "userId": "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
  "role": "facilitator"
}
```

The database binds the supplied actor to the authenticated user, prevents non-Administrators from assigning or removing roles, audits role changes, and prevents removal of the final Administrator role.

## Invite user

```http
POST /api/users/invite
Content-Type: application/json

{
  "email": "new.practitioner@example.com",
  "fullName": "New Practitioner",
  "role": "practitioner"
}
```

The invite flow:

- Generates a Supabase Auth invite link for new users, or a magic link for existing users.
- Assigns the selected portal role.
- Sends the invite email through Brevo transactional email.

Required server environment:

```bash
SUPABASE_SERVICE_ROLE_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Janzu Community Portal
```

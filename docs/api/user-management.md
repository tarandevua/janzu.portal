# User Management API

Sprint 14 adds portal user and role management for admins and managers.

## List users

```http
GET /api/users/manage
```

Requires `users:manage`.

Admins can manage all roles. Managers can view users and manage only `facilitator` and `practitioner` roles.

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

The database prevents non-admin users from assigning or removing `admin` and `manager` roles. It also prevents removal of the final admin role.

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

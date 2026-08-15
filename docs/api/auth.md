# Authentication API Examples

## Magic link sign in

The login form posts to the `sendMagicLink` server action.

```http
POST /en/login
Content-Type: multipart/form-data

email=practitioner@example.com
```

Supabase sends a one-time magic link. After the user clicks it, Supabase redirects to:

```txt
/en/auth/callback?code=<supabase-code>&locale=en
```

The callback exchanges the code for a session and redirects to:

```txt
/en/dashboard
```

Administrator-generated invitation links use the same callback with a one-time token hash and an `invite` or `magiclink` verification type. The callback verifies the token server-side and establishes the cookie session before redirecting to the dashboard. The token is not stored in application delivery records or logs.

The first authenticated dashboard request activates the portal account and atomically claims the one allowed welcome email. See [Welcome email contract](./welcome-email.md).

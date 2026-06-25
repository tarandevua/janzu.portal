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

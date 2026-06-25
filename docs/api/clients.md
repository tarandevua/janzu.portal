# Client CRM API Examples

Client records are private to the authenticated practitioner's own practitioner profile.

## List clients

```http
GET /api/clients
Cookie: sb-access-token=<session>
```

## Create client

```http
POST /api/clients
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+34 600 000 000",
  "notes": "Prefers morning sessions."
}
```

## Update client

```http
PUT /api/clients/<client-id>
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+34 600 000 000",
  "notes": "Updated notes."
}
```

## Delete client

```http
DELETE /api/clients/<client-id>
Cookie: sb-access-token=<session>
```

# Notifications API

Sprint 12 adds database-backed notifications for authenticated users.

The approved cross-workflow recipient, localization, preference, privacy, and idempotency contract is [DEC-06: Notification event matrix](../decisions/DEC-06-notification-event-matrix.md). Existing Sprint 12 event names remain legacy implementation details until their source workflow adopts the corresponding stable DEC-06 event type through a forward-only migration.

## List my notifications

```http
GET /api/notifications
```

Returns the latest 50 notifications for the signed-in user.

```json
{
  "data": {
    "notifications": [
      {
        "id": "38ec640a-d72b-4c27-944e-3ff5e63d4b9c",
        "userId": "f6b2b421-6df2-4632-a452-28f6951b0e60",
        "type": "feedback_received",
        "title": "Feedback from Maya",
        "body": "Maya submitted feedback for your session on 2026-06-26. Rating: 5/5.",
        "href": "/dashboard/feedback?feedbackId=6ae18098-27c7-4a67-9ab3-c4df34944470",
        "feedbackId": "6ae18098-27c7-4a67-9ab3-c4df34944470",
        "participantName": "Maya",
        "feedbackSessionDate": "2026-06-26",
        "feedbackRating": 5,
        "readAt": null,
        "createdAt": "2026-06-26T10:00:00.000Z",
        "updatedAt": "2026-06-26T10:00:00.000Z"
      }
    ],
    "unreadCount": 1
  },
  "error": null
}
```

## Mark notification read

```http
POST /api/notifications/read
Content-Type: application/json

{
  "notificationId": "38ec640a-d72b-4c27-944e-3ff5e63d4b9c"
}
```

The update is scoped to the current authenticated user by RLS and repository filtering.

## Automatic notification triggers

- Session feedback submitted: creates at most one notification per feedback record and includes the participant name, session date, rating, and a direct link to that record.
- Location approved: notifies the submitting practitioner.
- Event RSVP received: notifies the event creator.
- Certification eligible: notifies the practitioner when progress reaches review state.
- Certification approved: notifies the practitioner after administrator or instructor approval.

The feedback notification invariant is enforced by the partial unique index on `notifications.feedback_id`, not only by application behavior.

## Feedback notification backfill

Migration `202608140001_verify_feedback_notifications.sql` rechecks legacy matches in both directions: a notification and feedback record must be each other's unique closest match within five minutes. Equal-distance or otherwise ambiguous records remain unlinked and route to the authorized feedback list; the migration never guesses an exact destination.

# Notifications API

Sprint 12 adds database-backed notifications for authenticated users.

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

- Session feedback submitted: notifies the practitioner with the participant name, session date, rating, and a direct link to the feedback record.
- Location approved: notifies the submitting practitioner.
- Event RSVP received: notifies the event creator.
- Certification eligible: notifies the practitioner when progress reaches review state.
- Certification approved: notifies the practitioner after administrator or instructor approval.

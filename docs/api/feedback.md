# Session Feedback API Examples

## Create feedback link

```http
POST /api/feedback-links
Content-Type: application/json
Cookie: sb-access-token=<session>

{
  "sessionId": "00000000-0000-0000-0000-000000000000"
}
```

## Submit feedback

```http
POST /api/feedback/<token>
Content-Type: application/json

{
  "rating": 5,
  "experienceText": "The session felt safe and grounding.",
  "emotionalImpact": "I felt calmer and more open afterward."
}
```

When feedback is submitted, the linked session is marked validated by a database trigger.

Reopening a submitted feedback link returns the public confirmation state rather than the form.

## Authenticated feedback detail

Dashboard deep links use `feedbackId` to filter `list_feedback_dashboard`. The database function rejects anonymous calls and any request whose `actor_user_id` differs from `auth.uid()`. Practitioners can read feedback for their own sessions; the existing Administrator and Instructor review permissions remain unchanged.

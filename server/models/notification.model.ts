export type NotificationType =
  | "session_request_received"
  | "feedback_received"
  | "location_approved"
  | "event_invitation"
  | "event_rsvp_received"
  | "certification_progress"
  | "certification_approved";

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  feedbackId: string | null;
  participantName: string | null;
  feedbackSessionDate: string | null;
  feedbackRating: number | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationSummary = {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
};

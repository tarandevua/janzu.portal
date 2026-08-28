export type NotificationType =
  | "session_request_received"
  | "feedback_received"
  | "location_approved"
  | "event_invitation"
  | "event_rsvp_received"
  | "certification_progress"
  | "certification_approved"
  | "supervision_requested"
  | "supervision_accepted"
  | "supervision_declined"
  | "supervision_ended"
  | "training_history_submitted"
  | "training_history_corrected"
  | "training_history_reviewed"
  | "certification_milestone_25_reached"
  | "level_2_readiness_requested"
  | "level_2_readiness_decided";

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
  eventKey: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationSummary = {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
};

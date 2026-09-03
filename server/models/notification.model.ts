import type { Database } from "@/types/database";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

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

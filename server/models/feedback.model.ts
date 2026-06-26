export type SessionFeedback = {
  id: string;
  sessionId: string;
  token: string;
  rating: number;
  experienceText: string | null;
  emotionalImpact: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackInput = {
  rating: number;
  experienceText?: string | null;
  emotionalImpact?: string | null;
};

export type FeedbackStatus = {
  token: string;
  submittedAt: string | null;
};

export type FeedbackParticipant = {
  practitionerId: string;
  userId: string;
  displayName: string;
  email: string;
};

export type DashboardFeedback = {
  feedbackId: string;
  sessionId: string;
  practitionerId: string;
  practitionerUserId: string;
  practitionerName: string;
  practitionerEmail: string;
  clientName: string | null;
  sessionDate: string;
  rating: number;
  experienceText: string | null;
  emotionalImpact: string | null;
  submittedAt: string;
};

export type DashboardFeedbackPage = {
  items: DashboardFeedback[];
  totalCount: number;
};

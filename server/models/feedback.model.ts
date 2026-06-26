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

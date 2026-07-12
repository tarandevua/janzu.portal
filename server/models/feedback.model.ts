import type { Json } from "@/types/database";

export type SessionFeedback = {
  id: string;
  sessionId: string;
  token: string;
  participantEmail: string | null;
  rating: number;
  experienceText: string | null;
  emotionalImpact: string | null;
  feltInFacilitatorArms: string | null;
  supportAtEnd: "yes" | "not_enough" | "other" | null;
  supportOtherText: string | null;
  continueWaterProcess: "another_session" | "no_thank_you" | null;
  interestedLearningJanzu: boolean;
  learningName: string | null;
  learningPhone: string | null;
  anythingElse: string | null;
  gdprAgreed: boolean;
  submitterIp: string | null;
  submitterUserAgent: string | null;
  submitterDeviceId: string | null;
  submitterAcceptLanguage: string | null;
  submitterReferrer: string | null;
  submitterMetadata: Json;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackInput = {
  participantEmail: string;
  rating: number;
  experienceText?: string | null;
  emotionalImpact?: string | null;
  feltInFacilitatorArms?: string | null;
  supportAtEnd: "yes" | "not_enough" | "other";
  supportOtherText?: string | null;
  continueWaterProcess: "another_session" | "no_thank_you";
  interestedLearningJanzu: boolean;
  learningName?: string | null;
  learningPhone?: string | null;
  anythingElse?: string | null;
  gdprAgreed: boolean;
};

export type FeedbackSubmissionMetadata = {
  submitterIp?: string | null;
  submitterUserAgent?: string | null;
  submitterDeviceId?: string | null;
  submitterAcceptLanguage?: string | null;
  submitterReferrer?: string | null;
  submitterMetadata?: Json;
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
  participantEmail: string | null;
  sessionDate: string;
  rating: number;
  experienceText: string | null;
  emotionalImpact: string | null;
  feltInFacilitatorArms: string | null;
  supportAtEnd: string | null;
  supportOtherText: string | null;
  continueWaterProcess: string | null;
  interestedLearningJanzu: boolean;
  learningName: string | null;
  learningPhone: string | null;
  anythingElse: string | null;
  gdprAgreed: boolean;
  submittedAt: string;
};

export type DashboardFeedbackPage = {
  items: DashboardFeedback[];
  totalCount: number;
};

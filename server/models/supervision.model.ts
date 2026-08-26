export type SupervisionStatus = "pending" | "active" | "declined" | "ended" | "cancelled";

export type SupervisionPerson = {
  userId: string;
  displayName: string;
};

export type SupervisionAssignment = {
  id: string;
  traineeUserId: string;
  traineeName: string;
  instructorUserId: string;
  instructorName: string;
  status: SupervisionStatus;
  requestedAt: string;
  respondedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  updatedAt: string;
};

export type SupervisionDashboardTrainee = {
  assignmentId: string;
  traineeUserId: string;
  traineeName: string;
  practitionerId: string | null;
  currentLevel: "level_1" | "level_2" | "level_3" | null;
  verifiedTrainingCount: number;
  latestVerifiedTrainingId: string | null;
  journeyId: string | null;
  journeyState: import("@/server/models/certification.model").CertificationJourneyState | null;
  countedSessionsCount: number;
  nextSessionMilestone: 25 | 50;
  recentFeedbackId: string | null;
  recentFeedbackSessionDate: string | null;
  recentFeedbackRating: number | null;
};

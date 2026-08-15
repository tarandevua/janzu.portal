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

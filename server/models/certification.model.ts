export type CertificationStatus = "in_progress" | "eligible" | "approved";

export type CertificationProgress = {
  id: string;
  practitionerId: string;
  validatedSessionsCount: number;
  requiredSessionsCount: number;
  status: CertificationStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CertificationSummary = CertificationProgress & {
  remainingSessionsCount: number;
  percentComplete: number;
  isEligible: boolean;
};

export type CertificationApprovalCandidate = CertificationSummary & {
  userId: string;
  practitionerName: string;
  practitionerEmail: string;
  country: string | null;
  city: string | null;
};

export type SessionRequestStatus = "pending" | "accepted" | "declined";

export type SessionRequest = {
  id: string;
  practitionerId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  preferredDate: string | null;
  message: string | null;
  status: SessionRequestStatus;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionRequestInput = {
  practitionerId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string | null;
  preferredDate?: string | null;
  message?: string | null;
};

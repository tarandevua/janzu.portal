export type SessionRequestStatus = "pending" | "accepted" | "declined";

export type SessionRequest = {
  id: string;
  practitionerId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  availabilitySlotId: string | null;
  preferredDate: string | null;
  requestedStartAt: string | null;
  requestedEndAt: string | null;
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
  availabilitySlotId: string;
  message?: string | null;
};

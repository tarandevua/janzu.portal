export type SessionAvailabilityStatus = "available" | "booked" | "cancelled";

export type SessionAvailabilitySlot = {
  id: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  status: SessionAvailabilityStatus;
  sessionRequestId: string | null;
  recurrenceGroupId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionAvailabilityInput = {
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  recurrenceGroupId?: string | null;
};

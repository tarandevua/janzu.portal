export type Session = {
  id: string;
  practitionerId: string;
  clientId: string | null;
  sessionDate: string;
  durationMinutes: number;
  location: string | null;
  notes: string | null;
  isValidated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminSession = Session & {
  practitionerUserId: string | null;
  practitionerName: string;
  practitionerEmail: string;
  clientName: string | null;
};

export type SessionValidationFilter = "all" | "validated" | "pending";

export type AdminSessionFilters = {
  practitionerId?: string;
  validation?: SessionValidationFilter;
};

export type AdminSessionParticipant = {
  practitionerId: string;
  userId: string;
  displayName: string;
  email: string;
};

export type SessionInput = {
  clientId?: string | null;
  newClientName?: string | null;
  sessionDate: string;
  durationMinutes: number;
  location?: string | null;
  notes?: string | null;
};

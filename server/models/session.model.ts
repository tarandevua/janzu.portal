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

export type SessionInput = {
  clientId?: string | null;
  sessionDate: string;
  durationMinutes: number;
  location?: string | null;
  notes?: string | null;
};

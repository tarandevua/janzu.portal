export type Client = {
  id: string;
  practitionerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  notes?: string | null;
};

export type ClientsPage = {
  items: Client[];
  totalCount: number;
};

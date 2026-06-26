export type LocationType = "pool" | "spa" | "natural_water";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Location = {
  id: string;
  submittedBy: string;
  name: string;
  locationType: LocationType;
  description: string | null;
  latitude: number;
  longitude: number;
  accessInfo: string | null;
  status: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LocationInput = {
  name: string;
  locationType: LocationType;
  description?: string | null;
  latitude: number;
  longitude: number;
  accessInfo?: string | null;
  photoUrl?: string | null;
};

export type LocationMedia = {
  id: string;
  locationId: string;
  storageKey: string | null;
  publicUrl: string | null;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
};

export type LocationWithMedia = Location & {
  media: LocationMedia[];
};

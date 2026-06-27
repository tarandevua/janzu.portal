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
  approvedByName?: string | null;
  approvedAt: string | null;
  latestReview?: LocationReviewLog | null;
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
};

export type LocationMediaInput = {
  storageKey: string;
  publicUrl?: string | null;
  altText?: string | null;
  sortOrder: number;
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

export type LocationReviewAction = "approve" | "reject";

export type LocationReviewLog = {
  id: string;
  locationId: string;
  reviewerId: string;
  reviewerName?: string | null;
  action: LocationReviewAction;
  reason: string | null;
  createdAt: string;
};

export type LocationType = "pool" | "spa" | "natural_water";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TemperatureUnit = "celsius" | "fahrenheit";

export type Location = {
  id: string;
  submittedBy: string;
  name: string;
  locationType: LocationType;
  description: string | null;
  latitude: number;
  longitude: number;
  temperatureValue: number | null;
  temperatureUnit: TemperatureUnit | null;
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
  temperatureValue?: number | null;
  temperatureUnit?: TemperatureUnit | null;
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
  communityReviews?: LocationCommunityReview[];
  averageRating?: number | null;
  reviewsCount?: number;
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

export type LocationCommunityReview = {
  id: string;
  locationId: string;
  reviewerId: string;
  rating: number;
  reviewText: string | null;
  helpfulCount: number;
  viewerMarkedHelpful: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicPractitionerGroup = "apprentice" | "participant" | "facilitator";

export type PractitionerPracticeLocation = {
  id?: string;
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  note: string | null;
  sortOrder: number;
};

export type PractitionerProfile = {
  id: string;
  userId: string;
  publicGroup: PublicPractitionerGroup;
  displayName?: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  practiceLocations: PractitionerPracticeLocation[];
  languages: string[];
  website: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  tiktokUrl: string | null;
  profileImageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PractitionerProfileInput = {
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  practiceLocations?: PractitionerPracticeLocation[];
  languages?: string[];
  website?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  tiktokUrl?: string | null;
  profileImageUrl?: string | null;
  isPublic?: boolean;
};

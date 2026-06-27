export type PractitionerProfile = {
  id: string;
  userId: string;
  displayName?: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
  website: string | null;
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
  languages?: string[];
  website?: string | null;
  profileImageUrl?: string | null;
  isPublic?: boolean;
};

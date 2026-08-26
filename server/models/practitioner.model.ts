export type PublicPractitionerGroup = "apprentice" | "participant" | "facilitator" | "instructor";
export type ProfileVisibility = "private" | "community" | "public";

export type ProfileVisibilitySettings = {
  directory: ProfileVisibility;
  displayName: ProfileVisibility;
  profileImage: ProfileVisibility;
  bio: ProfileVisibility;
  languages: ProfileVisibility;
  location: ProfileVisibility;
  website: ProfileVisibility;
  socialLinks: ProfileVisibility;
  configuredAt: string | null;
};

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
  visibility: ProfileVisibilitySettings;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPractitionerProfile = Pick<
  PractitionerProfile,
  | "id"
  | "publicGroup"
  | "displayName"
  | "bio"
  | "country"
  | "city"
  | "languages"
  | "website"
  | "instagramUrl"
  | "facebookUrl"
  | "youtubeUrl"
  | "tiktokUrl"
  | "profileImageUrl"
>;

export type ProfileVisibilityInput = Omit<ProfileVisibilitySettings, "configuredAt">;

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
};

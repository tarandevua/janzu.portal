export type PublicPractitionerGroup = "apprentice" | "participant" | "facilitator" | "instructor";
export type ProfileVisibility = "private" | "community" | "public";
export const WHATSAPP_CONSENT_POLICY_VERSION = "2026-08-27.v1";

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

export type WhatsAppConsent = {
  number: string | null;
  visibility: "private" | "community";
  grantedAt: string | null;
  policyVersion: string | null;
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
  whatsapp: WhatsAppConsent;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryPractitionerProfile = Omit<Pick<
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
  | "whatsapp"
>, "whatsapp"> & { whatsapp?: WhatsAppConsent };

export type PractitionerMapPoint = {
  markerId: string;
  profileId: string;
  publicGroup: PublicPractitionerGroup;
  displayName: string;
  city: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  profileImageUrl: string | null;
  whatsappNumber: string | null;
};

export type ProfileVisibilityInput = Omit<ProfileVisibilitySettings, "configuredAt">;

export type WhatsAppConsentInput = {
  number: string | null;
  visibility: "private" | "community";
  affirmativeConsent: boolean;
  policyVersion: string;
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
};

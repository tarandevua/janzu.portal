import type { PractitionerProfile } from "@/server/models/practitioner.model";

function hasValidCoordinate(value: number | null | undefined, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function getProfileLocationCompletion(profile: PractitionerProfile | null) {
  const validPracticeLocation = profile?.practiceLocations.find(
    (location) =>
      hasValidCoordinate(location.latitude, -90, 90) &&
      hasValidCoordinate(location.longitude, -180, 180)
  );

  return {
    latitude: validPracticeLocation?.latitude ?? profile?.latitude,
    longitude: validPracticeLocation?.longitude ?? profile?.longitude,
  };
}

function hasOnlinePresence(profile: PractitionerProfile | null) {
  return Boolean(
    profile?.website ||
      profile?.instagramUrl ||
      profile?.facebookUrl ||
      profile?.youtubeUrl ||
      profile?.tiktokUrl
  );
}

export function getProfileCompletion(profile: PractitionerProfile | null) {
  const locationCompletion = getProfileLocationCompletion(profile);
  const fields = [
    profile?.displayName,
    profile?.bio,
    profile?.country,
    profile?.city,
    hasValidCoordinate(locationCompletion.latitude, -90, 90) ? locationCompletion.latitude : null,
    hasValidCoordinate(locationCompletion.longitude, -180, 180) ? locationCompletion.longitude : null,
    profile?.languages.length ? profile.languages : null,
    hasOnlinePresence(profile) ? "online" : null,
    profile?.profileImageUrl,
  ];
  const completedFields = fields.filter(
    (field) => field !== null && field !== undefined && field !== ""
  ).length;
  const totalFields = fields.length;

  return {
    completedFields,
    totalFields,
    percentComplete: Math.round((completedFields / totalFields) * 100),
  };
}

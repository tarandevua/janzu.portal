import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { CertificationSummary } from "@/server/models/certification.model";
import type { CommunityEvent } from "@/server/models/event.model";
import type { LocationWithMedia } from "@/server/models/location.model";
import type { Notification } from "@/server/models/notification.model";
import type { PractitionerProfile } from "@/server/models/practitioner.model";
import { syncCertificationProgress } from "@/server/repositories/certification.repository";
import { listLocationsByPractitionerId } from "@/server/repositories/location.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { toCertificationSummary } from "@/server/services/certification.service";
import { listPublicEvents } from "@/server/services/event.service";
import { listMyNotifications } from "@/server/services/notification.service";
import { getMyOnboardingProgress } from "@/server/services/onboarding.service";
import type { Locale } from "@/lib/i18n/config";

type ApprenticeDashboardData = {
  onboarding: Awaited<ReturnType<typeof getMyOnboardingProgress>>;
  profile: PractitionerProfile | null;
  profileCompletion: {
    completedFields: number;
    totalFields: number;
    percentComplete: number;
  };
  certification: CertificationSummary | null;
  counts: {
    sessions: number;
    validatedSessions: number;
    submittedLocations: number;
    approvedLocations: number;
    pendingLocations: number;
    upcomingEvents: number;
    rsvps: number;
    unreadNotifications: number;
  };
  recentLocations: LocationWithMedia[];
  upcomingEvents: CommunityEvent[];
  notifications: Notification[];
};

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

function getProfileCompletion(profile: PractitionerProfile | null) {
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
  const completedFields = fields.filter((field) => field !== null && field !== undefined && field !== "").length;
  const totalFields = fields.length;

  return {
    completedFields,
    totalFields,
    percentComplete: Math.round((completedFields / totalFields) * 100),
  };
}

async function getApprenticeProfileData(
  supabase: SupabaseServerClient,
  profile: PractitionerProfile | null
) {
  if (!profile) {
    return {
      certification: null,
      sessionsCount: 0,
      validatedSessionsCount: 0,
      locations: [] as LocationWithMedia[],
    };
  }

  const sessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id);
  const validatedSessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id)
    .eq("is_validated", true);

  const [sessionsCountResult, validatedSessionsCountResult, certificationProgress, locations] =
    await Promise.all([
      sessionsCountQuery,
      validatedSessionsCountQuery,
      syncCertificationProgress(supabase, profile.id),
      listLocationsByPractitionerId(supabase, profile.id),
    ]);

  const countError = sessionsCountResult.error ?? validatedSessionsCountResult.error;

  if (countError) {
    throw new Error(countError.message);
  }

  return {
    certification: toCertificationSummary(certificationProgress),
    sessionsCount: sessionsCountResult.count ?? 0,
    validatedSessionsCount: validatedSessionsCountResult.count ?? 0,
    locations,
  };
}

async function countMyEventRsvps(supabase: SupabaseServerClient, userId: string) {
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getApprenticeDashboardData(
  supabase: SupabaseServerClient,
  userId: string,
  locale: Locale
): Promise<ApprenticeDashboardData> {
  const profile = await getPractitionerProfileByUserId(supabase, userId);
  const [profileData, events, notificationSummary, rsvps, onboarding] = await Promise.all([
    getApprenticeProfileData(supabase, profile),
    listPublicEvents(supabase, userId),
    listMyNotifications(supabase, userId),
    countMyEventRsvps(supabase, userId),
    getMyOnboardingProgress(supabase, userId, locale),
  ]);
  const recentLocations = profileData.locations.slice(0, 5);
  const upcomingEvents = events.slice(0, 5);

  return {
    onboarding,
    profile,
    profileCompletion: getProfileCompletion(profile),
    certification: profileData.certification,
    counts: {
      sessions: profileData.sessionsCount,
      validatedSessions: profileData.validatedSessionsCount,
      submittedLocations: profileData.locations.length,
      approvedLocations: profileData.locations.filter((location) => location.status === "approved").length,
      pendingLocations: profileData.locations.filter((location) => location.status === "pending").length,
      upcomingEvents: events.length,
      rsvps,
      unreadNotifications: notificationSummary.unreadCount,
    },
    recentLocations,
    upcomingEvents,
    notifications: notificationSummary.notifications.slice(0, 5),
  };
}

export type { ApprenticeDashboardData };

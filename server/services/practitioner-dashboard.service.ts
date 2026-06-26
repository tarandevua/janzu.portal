import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardFeedback } from "@/server/models/feedback.model";
import type { LocationWithMedia } from "@/server/models/location.model";
import type { PractitionerProfile } from "@/server/models/practitioner.model";
import type { SessionRequest } from "@/server/models/session-request.model";
import type { Session } from "@/server/models/session.model";
import { syncCertificationProgress } from "@/server/repositories/certification.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { listSessionRequestsByPractitionerIdPage } from "@/server/repositories/session-request.repository";
import { listSessionsByPractitionerIdPage } from "@/server/repositories/session.repository";
import { findDashboardFeedback } from "@/server/services/feedback.service";
import { listMyLocations } from "@/server/services/location.service";
import { toCertificationSummary } from "@/server/services/certification.service";
import type { CertificationSummary } from "@/server/models/certification.model";

type PractitionerDashboardData = {
  profile: PractitionerProfile;
  certification: CertificationSummary;
  counts: {
    clients: number;
    sessions: number;
    validatedSessions: number;
    pendingRequests: number;
    feedback: number;
    locations: number;
    approvedLocations: number;
    pendingLocations: number;
  };
  recentSessions: Session[];
  recentRequests: SessionRequest[];
  recentFeedback: DashboardFeedback[];
  locations: LocationWithMedia[];
};

export async function getPractitionerDashboardData(
  supabase: SupabaseServerClient,
  userId: string
): Promise<PractitionerDashboardData | null> {
  const profile = await getPractitionerProfileByUserId(supabase, userId);

  if (!profile) {
    return null;
  }

  const clientsCountQuery = supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id);
  const sessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id);
  const validatedSessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id)
    .eq("is_validated", true);
  const pendingRequestsCountQuery = supabase
    .from("session_requests")
    .select("id", { count: "exact", head: true })
    .eq("practitioner_id", profile.id)
    .eq("status", "pending");

  const [
    clientsCountResult,
    sessionsCountResult,
    validatedSessionsCountResult,
    pendingRequestsCountResult,
    sessionsPage,
    requestsPage,
    feedbackPage,
    certificationProgress,
    locations,
  ] = await Promise.all([
    clientsCountQuery,
    sessionsCountQuery,
    validatedSessionsCountQuery,
    pendingRequestsCountQuery,
    listSessionsByPractitionerIdPage(supabase, profile.id, 1, 5),
    listSessionRequestsByPractitionerIdPage(supabase, profile.id, 1, 5),
    findDashboardFeedback(supabase, userId, profile.id, 1, 5),
    syncCertificationProgress(supabase, profile.id),
    listMyLocations(supabase, userId),
  ]);

  const countErrors = [
    clientsCountResult.error,
    sessionsCountResult.error,
    validatedSessionsCountResult.error,
    pendingRequestsCountResult.error,
  ].filter(Boolean);

  if (countErrors[0]) {
    throw new Error(countErrors[0].message);
  }

  return {
    profile,
    certification: toCertificationSummary(certificationProgress),
    counts: {
      clients: clientsCountResult.count ?? 0,
      sessions: sessionsCountResult.count ?? 0,
      validatedSessions: validatedSessionsCountResult.count ?? 0,
      pendingRequests: pendingRequestsCountResult.count ?? 0,
      feedback: feedbackPage.totalCount,
      locations: locations.length,
      approvedLocations: locations.filter((location) => location.status === "approved").length,
      pendingLocations: locations.filter((location) => location.status === "pending").length,
    },
    recentSessions: sessionsPage.items,
    recentRequests: requestsPage.items,
    recentFeedback: feedbackPage.items,
    locations,
  };
}

export type { PractitionerDashboardData };

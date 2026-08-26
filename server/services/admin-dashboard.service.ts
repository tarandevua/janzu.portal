import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { CertificationJourneySummary } from "@/server/models/certification.model";
import type { DashboardFeedback } from "@/server/models/feedback.model";
import type { LocationType } from "@/server/models/location.model";
import { listCertificationJourneysForReview } from "@/server/services/certification.service";
import { listFeedbackDashboard } from "@/server/repositories/feedback.repository";
import { listManagedUsers } from "@/server/repositories/rbac.repository";

export type AdminSessionActivityPoint = {
  date: string;
  desktop: number;
  mobile: number;
};

type AdminSessionActivitySource = {
  session_date: string;
  is_validated: boolean;
};

type RecentSessionRow = {
  id: string;
  session_date: string;
  duration_minutes: number;
  location: string | null;
  is_validated: boolean;
  practitioners: {
    users: {
      email: string | null;
      full_name: string | null;
    } | null;
  } | null;
};

type PendingLocationRow = {
  id: string;
  name: string;
  location_type: LocationType;
  created_at: string;
};

export type AdminRecentSession = {
  id: string;
  sessionDate: string;
  durationMinutes: number;
  location: string | null;
  isValidated: boolean;
  practitionerName: string;
  practitionerEmail: string;
};

export type AdminPendingLocation = {
  id: string;
  name: string;
  locationType: LocationType;
  createdAt: string;
};

export type AdminDashboardData = {
  counts: {
    users: number;
    practitioners: number;
    publicPractitioners: number;
    sessions: number;
    validatedSessions: number;
    pendingSessionRequests: number;
    submittedFeedback: number;
    pendingLocations: number;
    upcomingEvents: number;
    pendingCertifications: number;
  };
  sessionActivity: AdminSessionActivityPoint[];
  recentSessions: AdminRecentSession[];
  recentFeedback: DashboardFeedback[];
  pendingLocations: AdminPendingLocation[];
  certificationCandidates: CertificationJourneySummary[];
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

export function buildAdminSessionActivity(
  sessions: AdminSessionActivitySource[],
  referenceDate = new Date(),
  days = 90
): AdminSessionActivityPoint[] {
  const normalizedReferenceDate = new Date(toDateKey(referenceDate));
  const startDate = addDays(normalizedReferenceDate, -(days - 1));
  const points = new Map<string, AdminSessionActivityPoint>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = toDateKey(addDays(startDate, offset));
    points.set(date, { date, desktop: 0, mobile: 0 });
  }

  sessions.forEach((session) => {
    const point = points.get(session.session_date);

    if (!point) {
      return;
    }

    point.desktop += 1;

    if (session.is_validated) {
      point.mobile += 1;
    }
  });

  return [...points.values()];
}

function getCount(result: { count: number | null; error: { message: string } | null }) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

function toRecentSession(row: RecentSessionRow): AdminRecentSession {
  const practitioner = row.practitioners?.users;
  const email = practitioner?.email ?? "";

  return {
    id: row.id,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    location: row.location,
    isValidated: row.is_validated,
    practitionerName: practitioner?.full_name ?? email,
    practitionerEmail: email,
  };
}

function toPendingLocation(row: PendingLocationRow): AdminPendingLocation {
  return {
    id: row.id,
    name: row.name,
    locationType: row.location_type,
    createdAt: row.created_at,
  };
}

export async function getAdminDashboardData(
  supabase: SupabaseServerClient,
  actorUserId: string
): Promise<AdminDashboardData> {
  const today = new Date();
  const activityStartDate = toDateKey(addDays(new Date(toDateKey(today)), -89));
  const now = today.toISOString();

  const usersPromise = listManagedUsers(supabase, actorUserId);
  const practitionerRoleUsersPromise = listManagedUsers(supabase, actorUserId, 1, 1, {
    role: "practitioner",
  });
  const publicPractitionersCountQuery = supabase
    .from("practitioners")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true);
  const sessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true });
  const validatedSessionsCountQuery = supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("is_validated", true);
  const pendingRequestsCountQuery = supabase
    .from("session_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const submittedFeedbackCountQuery = supabase
    .from("session_feedback")
    .select("id", { count: "exact", head: true })
    .not("submitted_at", "is", null);
  const pendingLocationsCountQuery = supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  const upcomingEventsCountQuery = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("starts_at", now);
  const sessionActivityQuery = supabase
    .from("sessions")
    .select("session_date, is_validated")
    .gte("session_date", activityStartDate);
  const recentSessionsQuery = supabase
    .from("sessions")
    .select("id, session_date, duration_minutes, location, is_validated, practitioners(users(email, full_name))")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);
  const pendingLocationsQuery = supabase
    .from("locations")
    .select("id, name, location_type, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  const [
    users,
    practitionerRoleUsers,
    publicPractitionersCount,
    sessionsCount,
    validatedSessionsCount,
    pendingRequestsCount,
    submittedFeedbackCount,
    pendingLocationsCount,
    upcomingEventsCount,
    sessionActivity,
    recentSessions,
    pendingLocations,
    recentFeedback,
    certificationCandidates,
  ] = await Promise.all([
    usersPromise,
    practitionerRoleUsersPromise,
    publicPractitionersCountQuery,
    sessionsCountQuery,
    validatedSessionsCountQuery,
    pendingRequestsCountQuery,
    submittedFeedbackCountQuery,
    pendingLocationsCountQuery,
    upcomingEventsCountQuery,
    sessionActivityQuery,
    recentSessionsQuery,
    pendingLocationsQuery,
    listFeedbackDashboard(supabase, actorUserId, null, 1, 5),
    listCertificationJourneysForReview(supabase, actorUserId),
  ]);

  if (sessionActivity.error) {
    throw new Error(sessionActivity.error.message);
  }

  if (recentSessions.error) {
    throw new Error(recentSessions.error.message);
  }

  if (pendingLocations.error) {
    throw new Error(pendingLocations.error.message);
  }

  const pendingCertificationCandidates = certificationCandidates.filter(
    (candidate) => candidate.state === "sessions_50_reached"
  );

  return {
    counts: {
      users: users.totalCount,
      practitioners: practitionerRoleUsers.totalCount,
      publicPractitioners: getCount(publicPractitionersCount),
      sessions: getCount(sessionsCount),
      validatedSessions: getCount(validatedSessionsCount),
      pendingSessionRequests: getCount(pendingRequestsCount),
      submittedFeedback: getCount(submittedFeedbackCount),
      pendingLocations: getCount(pendingLocationsCount),
      upcomingEvents: getCount(upcomingEventsCount),
      pendingCertifications: pendingCertificationCandidates.length,
    },
    sessionActivity: buildAdminSessionActivity(
      (sessionActivity.data ?? []) as AdminSessionActivitySource[],
      today
    ),
    recentSessions: ((recentSessions.data ?? []) as unknown as RecentSessionRow[]).map(toRecentSession),
    recentFeedback: recentFeedback.items,
    pendingLocations: ((pendingLocations.data ?? []) as PendingLocationRow[]).map(toPendingLocation),
    certificationCandidates: pendingCertificationCandidates.slice(0, 5),
  };
}

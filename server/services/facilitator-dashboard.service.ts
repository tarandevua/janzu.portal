import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { AdminSessionActivityPoint } from "@/server/services/admin-dashboard.service";
import { buildAdminSessionActivity } from "@/server/services/admin-dashboard.service";

type CountResult = {
  count: number | null;
  error: { message: string } | null;
};

type SessionActivitySource = {
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

type RecentFeedbackRow = {
  id: string;
  rating: number;
  experience_text: string | null;
  emotional_impact: string | null;
  submitted_at: string;
  sessions: {
    session_date: string;
    practitioners: {
      users: {
        email: string | null;
        full_name: string | null;
      } | null;
    } | null;
  } | null;
};

type UpcomingEventRow = {
  id: string;
  title: string;
  location_name: string;
  starts_at: string;
  capacity: number;
};

export type FacilitatorRecentSession = {
  id: string;
  sessionDate: string;
  durationMinutes: number;
  location: string | null;
  isValidated: boolean;
  practitionerName: string;
  practitionerEmail: string;
};

export type FacilitatorRecentFeedback = {
  id: string;
  rating: number;
  text: string | null;
  submittedAt: string;
  sessionDate: string;
  practitionerName: string;
  practitionerEmail: string;
};

export type FacilitatorUpcomingEvent = {
  id: string;
  title: string;
  locationName: string;
  startsAt: string;
  capacity: number;
};

export type FacilitatorDashboardData = {
  counts: {
    practitioners: number;
    publicPractitioners: number;
    sessions: number;
    validatedSessions: number;
    pendingSessionRequests: number;
    submittedFeedback: number;
    upcomingEvents: number;
  };
  sessionActivity: AdminSessionActivityPoint[];
  recentSessions: FacilitatorRecentSession[];
  recentFeedback: FacilitatorRecentFeedback[];
  upcomingEvents: FacilitatorUpcomingEvent[];
};

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getCount(result: CountResult) {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.count ?? 0;
}

function getPractitionerName(
  practitioner: { email: string | null; full_name: string | null } | null | undefined
) {
  return {
    name: practitioner?.full_name ?? practitioner?.email ?? "",
    email: practitioner?.email ?? "",
  };
}

function toRecentSession(row: RecentSessionRow): FacilitatorRecentSession {
  const practitioner = getPractitionerName(row.practitioners?.users);

  return {
    id: row.id,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    location: row.location,
    isValidated: row.is_validated,
    practitionerName: practitioner.name,
    practitionerEmail: practitioner.email,
  };
}

function toRecentFeedback(row: RecentFeedbackRow): FacilitatorRecentFeedback {
  const practitioner = getPractitionerName(row.sessions?.practitioners?.users);

  return {
    id: row.id,
    rating: row.rating,
    text: row.experience_text ?? row.emotional_impact,
    submittedAt: row.submitted_at,
    sessionDate: row.sessions?.session_date ?? row.submitted_at,
    practitionerName: practitioner.name,
    practitionerEmail: practitioner.email,
  };
}

function toUpcomingEvent(row: UpcomingEventRow): FacilitatorUpcomingEvent {
  return {
    id: row.id,
    title: row.title,
    locationName: row.location_name,
    startsAt: row.starts_at,
    capacity: row.capacity,
  };
}

export async function getFacilitatorDashboardData(
  supabase: SupabaseServerClient
): Promise<FacilitatorDashboardData> {
  const today = new Date();
  const normalizedToday = new Date(toDateKey(today));
  const activityStartDate = toDateKey(addDays(normalizedToday, -89));
  const now = today.toISOString();

  const practitionersCountQuery = supabase
    .from("practitioners")
    .select("id", { count: "exact", head: true });
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
  const recentFeedbackQuery = supabase
    .from("session_feedback")
    .select(
      "id, rating, experience_text, emotional_impact, submitted_at, sessions(session_date, practitioners(users(email, full_name)))"
    )
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(5);
  const upcomingEventsQuery = supabase
    .from("events")
    .select("id, title, location_name, starts_at, capacity")
    .eq("status", "published")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })
    .limit(5);

  const [
    practitionersCount,
    publicPractitionersCount,
    sessionsCount,
    validatedSessionsCount,
    pendingRequestsCount,
    submittedFeedbackCount,
    upcomingEventsCount,
    sessionActivity,
    recentSessions,
    recentFeedback,
    upcomingEvents,
  ] = await Promise.all([
    practitionersCountQuery,
    publicPractitionersCountQuery,
    sessionsCountQuery,
    validatedSessionsCountQuery,
    pendingRequestsCountQuery,
    submittedFeedbackCountQuery,
    upcomingEventsCountQuery,
    sessionActivityQuery,
    recentSessionsQuery,
    recentFeedbackQuery,
    upcomingEventsQuery,
  ]);

  if (sessionActivity.error) {
    throw new Error(sessionActivity.error.message);
  }

  if (recentSessions.error) {
    throw new Error(recentSessions.error.message);
  }

  if (recentFeedback.error) {
    throw new Error(recentFeedback.error.message);
  }

  if (upcomingEvents.error) {
    throw new Error(upcomingEvents.error.message);
  }

  return {
    counts: {
      practitioners: getCount(practitionersCount),
      publicPractitioners: getCount(publicPractitionersCount),
      sessions: getCount(sessionsCount),
      validatedSessions: getCount(validatedSessionsCount),
      pendingSessionRequests: getCount(pendingRequestsCount),
      submittedFeedback: getCount(submittedFeedbackCount),
      upcomingEvents: getCount(upcomingEventsCount),
    },
    sessionActivity: buildAdminSessionActivity(
      (sessionActivity.data ?? []) as SessionActivitySource[],
      today
    ),
    recentSessions: ((recentSessions.data ?? []) as unknown as RecentSessionRow[]).map(toRecentSession),
    recentFeedback: ((recentFeedback.data ?? []) as unknown as RecentFeedbackRow[]).map(toRecentFeedback),
    upcomingEvents: ((upcomingEvents.data ?? []) as UpcomingEventRow[]).map(toUpcomingEvent),
  };
}

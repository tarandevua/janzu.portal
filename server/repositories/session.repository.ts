import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  AdminSession,
  AdminSessionFilters,
  AdminSessionParticipant,
  Session,
  SessionCreationMetadata,
  SessionInput,
} from "@/server/models/session.model";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
type AdminSessionRow = SessionRow & {
  clients: { name: string | null } | null;
  practitioners: {
    user_id: string | null;
    users: {
      email: string | null;
      full_name: string | null;
    } | null;
  } | null;
};
type AdminSessionParticipantRow = {
  id: string;
  user_id: string | null;
  users: {
    email: string | null;
    full_name: string | null;
  } | null;
};

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    clientId: row.client_id,
    sessionDate: row.session_date,
    durationMinutes: row.duration_minutes,
    location: row.location,
    notes: row.notes,
    isValidated: row.is_validated,
    createdByIp: row.created_by_ip,
    createdByUserAgent: row.created_by_user_agent,
    createdByDeviceId: row.created_by_device_id,
    createdByAcceptLanguage: row.created_by_accept_language,
    createdByReferrer: row.created_by_referrer,
    createdByMetadata: row.created_by_metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPractitionerName(
  user: { email: string | null; full_name: string | null } | null | undefined
) {
  return user?.full_name ?? user?.email ?? "";
}

function toAdminSession(row: AdminSessionRow): AdminSession {
  return {
    ...toSession(row),
    practitionerUserId: row.practitioners?.user_id ?? null,
    practitionerName: getPractitionerName(row.practitioners?.users),
    practitionerEmail: row.practitioners?.users?.email ?? "",
    clientName: row.clients?.name ?? null,
  };
}

function toAdminSessionParticipant(row: AdminSessionParticipantRow): AdminSessionParticipant {
  const email = row.users?.email ?? "";

  return {
    practitionerId: row.id,
    userId: row.user_id ?? "",
    displayName: row.users?.full_name ?? email,
    email,
  };
}

export async function listSessionsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toSession);
}

export async function listSessionsByPractitionerIdPage(
  supabase: SupabaseServerClient,
  practitionerId: string,
  page: number,
  pageSize: number
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("sessions")
    .select("*", { count: "exact" })
    .eq("practitioner_id", practitionerId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: (data ?? []).map(toSession),
    totalCount: count ?? 0,
  };
}

export async function listAdminSessionsPage(
  supabase: SupabaseServerClient,
  page: number,
  pageSize: number,
  filters: AdminSessionFilters = {}
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("sessions")
    .select("*, clients(name), practitioners(user_id, users(email, full_name))", { count: "exact" });

  if (filters.practitionerId) {
    query = query.eq("practitioner_id", filters.practitionerId);
  }

  if (filters.validation === "validated") {
    query = query.eq("is_validated", true);
  }

  if (filters.validation === "pending") {
    query = query.eq("is_validated", false);
  }

  const { data, error, count } = await query
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as AdminSessionRow[]).map(toAdminSession),
    totalCount: count ?? 0,
  };
}

export async function listAdminSessionParticipants(
  supabase: SupabaseServerClient
) {
  const { data, error } = await supabase
    .from("practitioners")
    .select("id, user_id, users(email, full_name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminSessionParticipantRow[])
    .map(toAdminSessionParticipant)
    .filter((participant) => participant.practitionerId && participant.userId);
}

export async function createSessionForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  input: SessionInput,
  metadata: SessionCreationMetadata = {}
) {
  const payload = {
    practitioner_id: practitionerId,
    client_id: input.clientId ?? null,
    session_date: input.sessionDate,
    duration_minutes: input.durationMinutes,
    location: input.location ?? null,
    notes: input.notes ?? null,
    created_by_ip: metadata.createdByIp ?? null,
    created_by_user_agent: metadata.createdByUserAgent ?? null,
    created_by_device_id: metadata.createdByDeviceId ?? null,
    created_by_accept_language: metadata.createdByAcceptLanguage ?? null,
    created_by_referrer: metadata.createdByReferrer ?? null,
    created_by_metadata: metadata.createdByMetadata ?? {},
  } satisfies Database["public"]["Tables"]["sessions"]["Insert"];

  const { data, error } = await supabase
    .from("sessions")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSession(data);
}

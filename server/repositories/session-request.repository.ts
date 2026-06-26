import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  SessionRequest,
  SessionRequestInput,
  SessionRequestStatus,
} from "@/server/models/session-request.model";
import type { Database } from "@/types/database";

type SessionRequestRow = Database["public"]["Tables"]["session_requests"]["Row"];
type SessionRequestInsert = Database["public"]["Tables"]["session_requests"]["Insert"];
type SessionRequestUpdate = Database["public"]["Tables"]["session_requests"]["Update"];

function toSessionRequest(row: SessionRequestRow): SessionRequest {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterPhone: row.requester_phone,
    preferredDate: row.preferred_date,
    message: row.message,
    status: row.status,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSessionRequest(
  supabase: SupabaseServerClient,
  input: SessionRequestInput
) {
  const payload = {
    practitioner_id: input.practitionerId,
    requester_name: input.requesterName,
    requester_email: input.requesterEmail,
    requester_phone: input.requesterPhone ?? null,
    preferred_date: input.preferredDate ?? null,
    message: input.message ?? null,
  } satisfies SessionRequestInsert;

  const { data, error } = await supabase
    .from("session_requests")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSessionRequest(data as SessionRequestRow);
}

export async function listSessionRequestsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const { data, error } = await supabase
    .from("session_requests")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SessionRequestRow[]).map(toSessionRequest);
}

export async function updateSessionRequestStatus(
  supabase: SupabaseServerClient,
  requestId: string,
  practitionerId: string,
  status: Exclude<SessionRequestStatus, "pending">
) {
  const payload = {
    status,
    reviewed_at: new Date().toISOString(),
  } satisfies SessionRequestUpdate;

  const { data, error } = await supabase
    .from("session_requests")
    .update(payload as never)
    .eq("id", requestId)
    .eq("practitioner_id", practitionerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSessionRequest(data as SessionRequestRow);
}

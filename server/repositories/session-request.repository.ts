import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  SessionRequest,
  SessionRequestInput,
  SessionRequestStatus,
} from "@/server/models/session-request.model";
import type { Database } from "@/types/database";

type SessionRequestRow = Database["public"]["Tables"]["session_requests"]["Row"];
type SessionRequestUpdate = Database["public"]["Tables"]["session_requests"]["Update"];
type BookPublicSessionRequestArgs =
  Database["public"]["Functions"]["book_public_session_request"]["Args"];

type SessionRequestRpcClient = {
  rpc(
    functionName: "book_public_session_request",
    args: BookPublicSessionRequestArgs
  ): Promise<{ data: SessionRequestRow | null; error: { message: string } | null }>;
};

function toSessionRequest(row: SessionRequestRow): SessionRequest {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterPhone: row.requester_phone,
    availabilitySlotId: row.availability_slot_id,
    preferredDate: row.preferred_date,
    requestedStartAt: row.requested_start_at,
    requestedEndAt: row.requested_end_at,
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
  const rpcClient = supabase as unknown as SessionRequestRpcClient;
  const { data, error } = await rpcClient.rpc("book_public_session_request", {
    target_slot_id: input.availabilitySlotId,
    target_requester_name: input.requesterName,
    target_requester_email: input.requesterEmail,
    target_requester_phone: input.requesterPhone ?? "",
    target_message: input.message ?? "",
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Session request could not be created.");
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

export async function listSessionRequestsByPractitionerIdPage(
  supabase: SupabaseServerClient,
  practitionerId: string,
  page: number,
  pageSize: number
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("session_requests")
    .select("*", { count: "exact" })
    .eq("practitioner_id", practitionerId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    items: ((data ?? []) as SessionRequestRow[]).map(toSessionRequest),
    totalCount: count ?? 0,
  };
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

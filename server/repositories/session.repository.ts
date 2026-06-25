import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Session, SessionInput } from "@/server/models/session.model";

type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function createSessionForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  input: SessionInput
) {
  const payload = {
    practitioner_id: practitionerId,
    client_id: input.clientId ?? null,
    session_date: input.sessionDate,
    duration_minutes: input.durationMinutes,
    location: input.location ?? null,
    notes: input.notes ?? null,
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

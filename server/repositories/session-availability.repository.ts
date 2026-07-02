import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  SessionAvailabilityInput,
  SessionAvailabilitySlot,
} from "@/server/models/session-availability.model";
import type { Database } from "@/types/database";

type SessionAvailabilityRow =
  Database["public"]["Tables"]["session_availability_slots"]["Row"];
type SessionAvailabilityInsert =
  Database["public"]["Tables"]["session_availability_slots"]["Insert"];

function toSessionAvailabilitySlot(row: SessionAvailabilityRow): SessionAvailabilitySlot {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    sessionRequestId: row.session_request_id,
    recurrenceGroupId: row.recurrence_group_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSessionAvailabilitySlot(
  supabase: SupabaseServerClient,
  input: SessionAvailabilityInput
) {
  const payload = {
    practitioner_id: input.practitionerId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    recurrence_group_id: input.recurrenceGroupId ?? null,
  } satisfies SessionAvailabilityInsert;

  const { data, error } = await supabase
    .from("session_availability_slots")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSessionAvailabilitySlot(data as SessionAvailabilityRow);
}

export async function createSessionAvailabilitySlots(
  supabase: SupabaseServerClient,
  inputs: SessionAvailabilityInput[]
) {
  if (inputs.length === 0) {
    return [];
  }

  const payload = inputs.map((input) => ({
    practitioner_id: input.practitionerId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    recurrence_group_id: input.recurrenceGroupId ?? null,
  })) satisfies SessionAvailabilityInsert[];

  const { data, error } = await supabase
    .from("session_availability_slots")
    .insert(payload as never)
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SessionAvailabilityRow[]).map(toSessionAvailabilitySlot);
}

export async function listUpcomingAvailabilitySlotsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string,
  limit = 50
) {
  const { data, error } = await supabase
    .from("session_availability_slots")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SessionAvailabilityRow[]).map(toSessionAvailabilitySlot);
}

export async function listPublicAvailableSlotsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string,
  limit = 30
) {
  const { data, error } = await supabase
    .from("session_availability_slots")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SessionAvailabilityRow[]).map(toSessionAvailabilitySlot);
}

export async function cancelSessionAvailabilitySlot(
  supabase: SupabaseServerClient,
  practitionerId: string,
  slotId: string
) {
  const { data, error } = await supabase
    .from("session_availability_slots")
    .update({ status: "cancelled" } as never)
    .eq("id", slotId)
    .eq("practitioner_id", practitionerId)
    .eq("status", "available")
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toSessionAvailabilitySlot(data as SessionAvailabilityRow);
}

export async function cancelSessionAvailabilitySeries(
  supabase: SupabaseServerClient,
  practitionerId: string,
  recurrenceGroupId: string
) {
  const { data, error } = await supabase
    .from("session_availability_slots")
    .update({ status: "cancelled" } as never)
    .eq("practitioner_id", practitionerId)
    .eq("recurrence_group_id", recurrenceGroupId)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString())
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SessionAvailabilityRow[]).map(toSessionAvailabilitySlot);
}

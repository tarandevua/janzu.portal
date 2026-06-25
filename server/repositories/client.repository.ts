import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Client, ClientInput } from "@/server/models/client.model";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listClientsByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string
) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toClient);
}

export async function createClientForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  input: ClientInput
) {
  const payload = {
    practitioner_id: practitionerId,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
  } satisfies Database["public"]["Tables"]["clients"]["Insert"];

  const { data, error } = await supabase
    .from("clients")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toClient(data);
}

export async function updateClientForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string,
  input: ClientInput
) {
  const payload = {
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    notes: input.notes ?? null,
  } satisfies Database["public"]["Tables"]["clients"]["Update"];

  const { data, error } = await supabase
    .from("clients")
    .update(payload as never)
    .eq("id", clientId)
    .eq("practitioner_id", practitionerId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toClient(data);
}

export async function deleteClientForPractitioner(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string
) {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("practitioner_id", practitionerId);

  if (error) {
    throw new Error(error.message);
  }
}

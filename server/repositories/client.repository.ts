import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  Client,
  ClientFollowUpFilter,
  ClientInput,
  ClientLifecycleStatus,
  ClientsPage,
} from "@/server/models/client.model";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function toClient(row: ClientRow, nextFollowUp: Client["nextFollowUp"] = null): Client {
  return {
    id: row.id,
    practitionerId: row.practitioner_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    city: row.city,
    notes: row.notes,
    lifecycleStatus: row.lifecycle_status,
    nextFollowUp,
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

  return ((data ?? []) as unknown as ClientRow[]).map((row) => toClient(row));
}

export async function listClientsByPractitionerIdPage(
  supabase: SupabaseServerClient,
  practitionerId: string,
  page: number,
  pageSize: number,
  lifecycleStatus?: ClientLifecycleStatus,
  followUpFilter: ClientFollowUpFilter = "all",
  today = new Date().toISOString().slice(0, 10)
): Promise<ClientsPage> {
  const from = (page - 1) * pageSize;
  const { data, error } = await supabase.rpc("list_my_client_management" as never, {
    p_practitioner_id: practitionerId,
    p_lifecycle_status: lifecycleStatus ?? null,
    p_follow_up_filter: followUpFilter,
    p_today: today,
    p_offset: from,
    p_limit: pageSize,
  } as never);
  if (error) throw new Error(error.message);
  type SummaryRow = ClientRow & {
    follow_up_record_id: string | null;
    follow_up_on: string | null;
    total_count: number;
  };
  const rows = (data ?? []) as unknown as SummaryRow[];
  return {
    items: rows.map((row) => toClient(row, row.follow_up_record_id && row.follow_up_on ? {
      recordId: row.follow_up_record_id,
      followUpOn: row.follow_up_on,
    } : null)),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

export async function getClientByPractitionerId(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string
) {
  const [clientResult, followUpResult] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("practitioner_id", practitionerId)
      .maybeSingle(),
    supabase
      .from("client_outreach_records")
      .select("id, follow_up_on")
      .eq("client_id", clientId)
      .eq("practitioner_id", practitionerId)
      .eq("follow_up_status", "open")
      .maybeSingle(),
  ]);

  const { data, error } = clientResult;
  const { data: openFollowUp, error: followUpError } = followUpResult;
  if (error) throw new Error(error.message);
  if (!data) return null;

  if (followUpError) throw new Error(followUpError.message);
  const followUp = openFollowUp as unknown as { id: string; follow_up_on: string } | null;
  return toClient(data, followUp ? {
    recordId: followUp.id,
    followUpOn: followUp.follow_up_on,
  } : null);
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
    country: input.country ?? null,
    city: input.city ?? null,
    notes: input.notes ?? null,
    lifecycle_status: input.lifecycleStatus ?? "active",
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
    country: input.country ?? null,
    city: input.city ?? null,
    notes: input.notes ?? null,
    lifecycle_status: input.lifecycleStatus ?? "active",
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

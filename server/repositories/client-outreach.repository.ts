import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  ClientOutreachInput,
  ClientOutreachPage,
  ClientOutreachRecord,
} from "@/server/models/client.model";

type OutreachRow = Database["public"]["Tables"]["client_outreach_records"]["Row"];

function toOutreachRecord(row: OutreachRow): ClientOutreachRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    practitionerId: row.practitioner_id,
    contactedOn: row.contacted_on,
    channel: row.channel,
    channelOther: row.channel_other,
    sessionOffered: row.session_offered,
    response: row.response,
    responseOther: row.response_other,
    notes: row.notes,
    followUpOn: row.follow_up_on,
    followUpStatus: row.follow_up_status,
    followUpCompletedAt: row.follow_up_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listClientOutreachPage(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string,
  page: number,
  pageSize: number
): Promise<ClientOutreachPage> {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await supabase
    .from("client_outreach_records")
    .select("*", { count: "exact" })
    .eq("client_id", clientId)
    .eq("practitioner_id", practitionerId)
    .order("contacted_on", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []).map(toOutreachRecord), totalCount: count ?? 0 };
}

export async function createClientOutreach(
  supabase: SupabaseServerClient,
  clientId: string,
  input: ClientOutreachInput
) {
  const { data, error } = await supabase.rpc("create_client_outreach_record" as never, {
    p_client_id: clientId,
    p_contacted_on: input.contactedOn,
    p_channel: input.channel,
    p_channel_other: input.channelOther ?? null,
    p_session_offered: input.sessionOffered,
    p_response: input.response,
    p_response_other: input.responseOther ?? null,
    p_notes: input.notes ?? null,
    p_follow_up_on: input.followUpOn ?? null,
  } as never);
  if (error) throw new Error(error.message);
  return toOutreachRecord(data as unknown as OutreachRow);
}

export async function updateClientOutreach(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string,
  recordId: string,
  input: ClientOutreachInput
) {
  const { data: current, error: currentError } = await supabase
    .from("client_outreach_records")
    .select("*")
    .eq("id", recordId)
    .eq("client_id", clientId)
    .eq("practitioner_id", practitionerId)
    .single();
  if (currentError) throw new Error(currentError.message);

  const payload: Database["public"]["Tables"]["client_outreach_records"]["Update"] = {
    contacted_on: input.contactedOn,
    channel: input.channel,
    channel_other: input.channel === "other" ? input.channelOther ?? null : null,
    session_offered: input.sessionOffered,
    response: input.response,
    response_other: input.response === "other" ? input.responseOther ?? null : null,
    notes: input.notes ?? null,
  };
  const currentRow = current as unknown as OutreachRow;
  if (currentRow.follow_up_status === "open") {
    payload.follow_up_on = input.followUpOn ?? null;
    payload.follow_up_status = input.followUpOn ? "open" : null;
  }
  const { data, error } = await supabase
    .from("client_outreach_records")
    .update(payload as never)
    .eq("id", recordId)
    .eq("client_id", clientId)
    .eq("practitioner_id", practitionerId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toOutreachRecord(data);
}

export async function deleteClientOutreach(
  supabase: SupabaseServerClient,
  practitionerId: string,
  clientId: string,
  recordId: string
) {
  const { error } = await supabase
    .from("client_outreach_records")
    .delete()
    .eq("id", recordId)
    .eq("client_id", clientId)
    .eq("practitioner_id", practitionerId);
  if (error) throw new Error(error.message);
}

export async function completeClientFollowUp(supabase: SupabaseServerClient, recordId: string) {
  const { data, error } = await supabase.rpc("complete_client_follow_up" as never, { p_record_id: recordId } as never);
  if (error) throw new Error(error.message);
  return toOutreachRecord(data as unknown as OutreachRow);
}

export async function rescheduleClientFollowUp(
  supabase: SupabaseServerClient,
  recordId: string,
  followUpOn: string
) {
  const { data, error } = await supabase.rpc("reschedule_client_follow_up" as never, {
    p_record_id: recordId,
    p_follow_up_on: followUpOn,
  } as never);
  if (error) throw new Error(error.message);
  return toOutreachRecord(data as unknown as OutreachRow);
}

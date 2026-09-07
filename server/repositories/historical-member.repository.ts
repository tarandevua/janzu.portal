import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { HistoricalAction, HistoricalImportRow } from "@/server/validators/historical-member.schema";
import type { Database, Json } from "@/types/database";

const columns = "id,member_user_id,source,source_key,kind,details,status,revision,reviewer_user_id,senior_decision,senior_total,approved_total,decided_by,created_at,updated_at" as const;
export async function listHistoricalClaims(db: SupabaseServerClient, page: number, claimId?: string) {
  let query = db.from("historical_member_claims").select(columns).order("updated_at", { ascending: false }).order("id");
  if (claimId) query = query.eq("id", claimId);
  const { data, error } = await query.range((page - 1) * 25, page * 25);
  if (error) throw error;
  return { claims: (data ?? []).slice(0, 25), hasNext: (data?.length ?? 0) > 25 };
}
export async function listHistoricalEvents(db: SupabaseServerClient, claimId: string) {
  const { data, error } = await db.from("historical_member_events").select("*").eq("claim_id", claimId).order("occurred_at", { ascending: true }).order("id");
  if (error) throw error;
  return data ?? [];
}
export async function importHistoricalClaims(db: SupabaseServerClient, actor: string, rows: HistoricalImportRow[], commit: boolean) {
  const rpc = db as unknown as { rpc(name: "import_historical_members", args: Database["public"]["Functions"]["import_historical_members"]["Args"]): Promise<{ data: Database["public"]["Functions"]["import_historical_members"]["Returns"]; error: { code: string; message: string } | null }> };
  const { data, error } = await rpc.rpc("import_historical_members", { actor_user_id: actor, import_rows: rows as unknown as Json, commit_import: commit });
  if (error) throw error;
  return data;
}
export async function changeHistoricalClaim(db: SupabaseServerClient, actor: string, command: HistoricalAction) {
  const rpc = db as unknown as { rpc(name: "act_on_historical_claim", args: Database["public"]["Functions"]["act_on_historical_claim"]["Args"]): Promise<{ data: Database["public"]["Functions"]["act_on_historical_claim"]["Returns"]; error: { code: string; message: string } | null }> };
  const { data, error } = await rpc.rpc("act_on_historical_claim", { actor_user_id: actor, command: command as unknown as Json });
  if (error) throw error;
  return data;
}

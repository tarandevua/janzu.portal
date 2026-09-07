import type { SupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { importHistoricalClaims, changeHistoricalClaim } from "@/server/repositories/historical-member.repository";
import { historicalImportSchema, historicalActionSchema } from "@/server/validators/historical-member.schema";
import { hasRole } from "@/server/services/rbac.service";

export async function importHistoricalMembers(db: SupabaseServerClient, actor: string, rows: unknown, commit: boolean) {
  const roles = await listUserRoles(db, actor);
  if (!hasRole(roles, "admin")) throw Object.assign(new Error("Administrator required"), { code: "42501" });
  return importHistoricalClaims(db, actor, historicalImportSchema.parse(rows), commit);
}
export async function actOnHistoricalMember(db: SupabaseServerClient, actor: string, command: unknown) {
  // The actor comes from auth.getUser(); the RPC repeats actor, role, target,
  // current designation, independence, and state checks under a transaction lock.
  return changeHistoricalClaim(db, actor, historicalActionSchema.parse(command));
}

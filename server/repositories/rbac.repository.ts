import type { SupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRoles } from "@/server/services/rbac.service";
import type { Role } from "@/server/models/rbac.model";

type RoleJoinRow = {
  roles: {
    name: Role;
  } | null;
};

export async function listUserRoles(
  supabase: SupabaseServerClient,
  userId: string
): Promise<Role[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RoleJoinRow[];
  return normalizeRoles(rows.map((row) => row.roles?.name));
}

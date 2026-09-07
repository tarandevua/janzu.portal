import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Check only members already returned by the dashboard's authorized workflow queries. */
export async function getCertificationDashboardTraineeIds(userIds: string[]) {
  const traineeIds = new Set<string>();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return traineeIds;

  // Instructors cannot read other users' role assignments through the session client.
  const supabase = createSupabaseAdminClient();
  for (let offset = 0; offset < uniqueIds.length; offset += 200) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id, roles!inner(name)")
      .eq("roles.name", "apprentice") // The displayed role name is Trainee.
      .in("user_id", uniqueIds.slice(offset, offset + 200));

    if (error) throw new Error(error.message);
    for (const row of data ?? []) traineeIds.add(row.user_id);
  }
  return traineeIds;
}

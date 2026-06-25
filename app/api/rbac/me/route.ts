import { getCurrentUserRoles } from "@/server/controllers/rbac.controller";

export async function GET() {
  return getCurrentUserRoles();
}

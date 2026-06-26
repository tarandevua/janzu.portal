import { listManagedPortalUsers } from "@/server/controllers/user-management.controller";

export async function GET() {
  return listManagedPortalUsers();
}

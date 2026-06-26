import { type NextRequest } from "next/server";
import { assignManagedPortalUserRole } from "@/server/controllers/user-management.controller";

export async function POST(request: NextRequest) {
  return assignManagedPortalUserRole(request);
}

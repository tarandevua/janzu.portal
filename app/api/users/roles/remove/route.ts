import { type NextRequest } from "next/server";
import { removeManagedPortalUserRole } from "@/server/controllers/user-management.controller";

export async function POST(request: NextRequest) {
  return removeManagedPortalUserRole(request);
}

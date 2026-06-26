import { type NextRequest } from "next/server";
import { inviteManagedPortalUser } from "@/server/controllers/user-management.controller";

export async function POST(request: NextRequest) {
  return inviteManagedPortalUser(request);
}

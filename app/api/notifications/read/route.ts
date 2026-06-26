import { type NextRequest } from "next/server";
import { markCurrentUserNotificationRead } from "@/server/controllers/notification.controller";

export async function POST(request: NextRequest) {
  return markCurrentUserNotificationRead(request);
}

import { listCurrentUserNotifications } from "@/server/controllers/notification.controller";

export async function GET() {
  return listCurrentUserNotifications();
}

import { listManagedCommunityEvents } from "@/server/controllers/event.controller";

export async function GET() {
  return listManagedCommunityEvents();
}

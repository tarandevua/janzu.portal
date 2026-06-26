import { type NextRequest } from "next/server";
import { rsvpToCommunityEvent } from "@/server/controllers/event.controller";

export async function POST(request: NextRequest) {
  return rsvpToCommunityEvent(request);
}

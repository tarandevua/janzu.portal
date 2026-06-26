import { type NextRequest } from "next/server";
import {
  createCommunityEvent,
  listPublishedPublicEvents,
} from "@/server/controllers/event.controller";

export async function GET() {
  return listPublishedPublicEvents();
}

export async function POST(request: NextRequest) {
  return createCommunityEvent(request);
}

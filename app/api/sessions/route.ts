import { type NextRequest } from "next/server";
import {
  createCurrentUserSession,
  listCurrentUserSessions,
} from "@/server/controllers/session.controller";

export async function GET() {
  return listCurrentUserSessions();
}

export async function POST(request: NextRequest) {
  return createCurrentUserSession(request);
}

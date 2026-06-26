import { type NextRequest } from "next/server";
import {
  createPublicSessionRequest,
  listCurrentPractitionerSessionRequests,
} from "@/server/controllers/session-request.controller";

export async function GET() {
  return listCurrentPractitionerSessionRequests();
}

export async function POST(request: NextRequest) {
  return createPublicSessionRequest(request);
}

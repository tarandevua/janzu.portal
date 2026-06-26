import { type NextRequest } from "next/server";
import { reviewCurrentPractitionerSessionRequest } from "@/server/controllers/session-request.controller";

export async function POST(request: NextRequest) {
  return reviewCurrentPractitionerSessionRequest(request);
}

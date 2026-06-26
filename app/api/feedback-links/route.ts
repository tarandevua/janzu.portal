import { type NextRequest } from "next/server";
import { createCurrentUserFeedbackLink } from "@/server/controllers/feedback.controller";

export async function POST(request: NextRequest) {
  return createCurrentUserFeedbackLink(request);
}

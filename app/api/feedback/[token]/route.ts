import { type NextRequest } from "next/server";
import { submitFeedback } from "@/server/controllers/feedback.controller";

type FeedbackRouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: NextRequest, context: FeedbackRouteContext) {
  const { token } = await context.params;
  return submitFeedback(request, token);
}

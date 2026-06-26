import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createMySessionFeedbackLink,
  submitPublicFeedback,
} from "@/server/services/feedback.service";
import { feedbackSchema, feedbackTokenSchema } from "@/server/validators/feedback.schema";

export async function createCurrentUserFeedbackLink(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

  if (!sessionId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Session id is required." } },
      { status: 422 }
    );
  }

  const feedback = await createMySessionFeedbackLink(supabase, user.id, sessionId);

  return NextResponse.json({ data: feedback, error: null }, { status: 201 });
}

export async function submitFeedback(request: NextRequest, token: string) {
  const tokenResult = feedbackTokenSchema.safeParse(token);

  if (!tokenResult.success) {
    return NextResponse.json(
      { data: null, error: { code: "INVALID_TOKEN", message: "Feedback link is invalid." } },
      { status: 404 }
    );
  }

  const parsed = feedbackSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Feedback payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const feedback = await submitPublicFeedback(supabase, tokenResult.data, parsed.data);

  return NextResponse.json({ data: feedback, error: null });
}

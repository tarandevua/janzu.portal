import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import {
  listMySessionRequests,
  reviewMySessionRequest,
  submitPublicSessionRequest,
} from "@/server/services/session-request.service";
import {
  sessionRequestReviewSchema,
  sessionRequestSchema,
} from "@/server/validators/session-request.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function createPublicSessionRequest(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const parsed = sessionRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session request payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const sessionRequest = await submitPublicSessionRequest(supabase, parsed.data);

  return NextResponse.json({ data: sessionRequest, error: null }, { status: 201 });
}

export async function listCurrentPractitionerSessionRequests() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const practitioner = await getPractitionerProfileByUserId(supabase, user.id);

  if (!practitioner) {
    return NextResponse.json(
      { data: null, error: { code: "PROFILE_REQUIRED", message: "Practitioner profile is required." } },
      { status: 403 }
    );
  }

  const requests = await listMySessionRequests(supabase, practitioner.id);

  return NextResponse.json({ data: requests, error: null });
}

export async function reviewCurrentPractitionerSessionRequest(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const parsed = sessionRequestReviewSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Session request review payload is invalid.",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 }
    );
  }

  const sessionRequest = await reviewMySessionRequest(
    supabase,
    user.id,
    parsed.data.requestId,
    parsed.data.status
  );

  return NextResponse.json({ data: sessionRequest, error: null });
}

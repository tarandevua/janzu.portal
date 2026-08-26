import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCertificationJourney,
  listCertificationJourneysForReview,
  overrideCertificationState,
} from "@/server/services/certification.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { hasPermission } from "@/server/services/rbac.service";
import { certificationOverrideSchema } from "@/server/validators/certification.schema";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const unauthenticated = () =>
  NextResponse.json(
    { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
    { status: 401 }
  );

export async function getCurrentCertificationProgress() {
  const { supabase, user } = await getUserContext();
  if (!user) return unauthenticated();

  try {
    const progress = await getCertificationJourney(supabase, user.id, user.id);
    return NextResponse.json({ data: progress, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "NOT_AVAILABLE", message: (error as Error).message } },
      { status: 404 }
    );
  }
}

export async function listCertificationJourneyQueue() {
  const { supabase, user } = await getUserContext();
  if (!user) return unauthenticated();

  const roles = await listUserRoles(supabase, user.id);
  if (!roles.includes("instructor") && !hasPermission(roles, "certifications:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Certification review access is required." } },
      { status: 403 }
    );
  }

  const journeys = await listCertificationJourneysForReview(supabase, user.id);
  return NextResponse.json({ data: journeys, error: null });
}

export async function overrideCertification(request: NextRequest) {
  const { supabase, user } = await getUserContext();
  if (!user) return unauthenticated();

  const roles = await listUserRoles(supabase, user.id);
  if (!hasPermission(roles, "certifications:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Administrator access is required." } },
      { status: 403 }
    );
  }

  const parsed = certificationOverrideSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Check the override fields." } },
      { status: 422 }
    );
  }

  try {
    const journey = await overrideCertificationState(supabase, user.id, parsed.data);
    return NextResponse.json({ data: journey, error: null });
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: "TRANSITION_REJECTED", message: (error as Error).message } },
      { status: 409 }
    );
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  approvePractitionerCertification,
  getMyCertificationSummary,
  listCertificationCandidatesForReview,
} from "@/server/services/certification.service";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { hasPermission } from "@/server/services/rbac.service";

async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getCurrentCertificationProgress() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const progress = await getMyCertificationSummary(supabase, user.id);

  return NextResponse.json({ data: progress, error: null });
}

export async function listCertificationApprovalQueue() {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "certifications:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Certification reviewer access is required." } },
      { status: 403 }
    );
  }

  const candidates = await listCertificationCandidatesForReview(supabase, user.id);

  return NextResponse.json({ data: candidates, error: null });
}

export async function approveCertification(request: NextRequest) {
  const { supabase, user } = await getUserContext();

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHENTICATED", message: "Sign in is required." } },
      { status: 401 }
    );
  }

  const body = await request.json();
  const practitionerId = typeof body.practitionerId === "string" ? body.practitionerId : "";

  if (!practitionerId) {
    return NextResponse.json(
      { data: null, error: { code: "VALIDATION_ERROR", message: "Practitioner id is required." } },
      { status: 422 }
    );
  }

  const roles = await listUserRoles(supabase, user.id);

  if (!hasPermission(roles, "certifications:approve")) {
    return NextResponse.json(
      { data: null, error: { code: "FORBIDDEN", message: "Certification reviewer access is required." } },
      { status: 403 }
    );
  }

  const progress = await approvePractitionerCertification(supabase, practitionerId, user.id);

  return NextResponse.json({ data: progress, error: null });
}

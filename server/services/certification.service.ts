import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { CertificationProgress, CertificationSummary } from "@/server/models/certification.model";
import {
  approveCertificationProgress,
  listCertificationApprovalCandidates,
  syncCertificationProgress,
} from "@/server/repositories/certification.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";

export function toCertificationSummary(progress: CertificationProgress): CertificationSummary {
  const remainingSessionsCount = Math.max(
    progress.requiredSessionsCount - progress.validatedSessionsCount,
    0
  );

  return {
    ...progress,
    remainingSessionsCount,
    percentComplete: Math.min(
      Math.round((progress.validatedSessionsCount / progress.requiredSessionsCount) * 100),
      100
    ),
    isEligible: progress.validatedSessionsCount >= progress.requiredSessionsCount,
  };
}

export async function getMyCertificationSummary(
  supabase: SupabaseServerClient,
  userId: string
) {
  const practitioner = await getPractitionerProfileByUserId(supabase, userId);

  if (!practitioner) {
    throw new Error("Practitioner profile is required before tracking certification.");
  }

  const progress = await syncCertificationProgress(supabase, practitioner.id);
  return toCertificationSummary(progress);
}

export async function approvePractitionerCertification(
  supabase: SupabaseServerClient,
  practitionerId: string,
  approverUserId: string
) {
  const progress = await approveCertificationProgress(supabase, practitionerId, approverUserId);
  return toCertificationSummary(progress);
}

export async function listCertificationCandidatesForReview(
  supabase: SupabaseServerClient,
  reviewerUserId: string
) {
  return listCertificationApprovalCandidates(supabase, reviewerUserId);
}

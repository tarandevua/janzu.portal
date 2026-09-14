"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  overrideCertificationState,
  submitLevel2ReadinessDecision,
  submitLevel2ReadinessRequest,
  submitAssessmentReadinessRequest,
  submitAssessmentReadinessDecision,
  updateAssessorDesignation,
  submitAssessmentAssessor,
  submitAssessmentAssessorCancellation,
  submitAssessmentSchedule,
  submitAssessmentOutcome,
  submitAssessmentRemediationVerification,
} from "@/server/services/certification.service";
import { hasPermission } from "@/server/services/rbac.service";
import {
  certificationOverrideSchema,
  level2ReadinessDecisionSchema,
  level2ReadinessRequestSchema,
  assessmentReadinessRequestSchema,
  assessmentReadinessDecisionSchema,
  assessorDesignationSchema,
  assessmentAssignmentSchema,
  assessmentAssignmentCancellationSchema,
  assessmentScheduleSchema,
  assessmentOutcomeSchema,
  assessmentRemediationSchema,
  certificateIssueSchema,
  certificateReplacementSchema,
  certificateRevocationSchema,
  certificateReplacementRequestSchema,
  certificateReplacementRejectionSchema,
  certificateAppealSchema,
  certificateAppealDecisionSchema,
} from "@/server/validators/certification.schema";
import type { AssessmentStatus } from "@/server/models/certification.model";
import {
  CertificateTemplateNotConfiguredError,
  issueDigitalCertificate,
  replaceDigitalCertificate,
  reinstateDigitalCertificate,
  requestDigitalCertificateReplacement,
  rejectDigitalCertificateReplacement,
  revokeDigitalCertificate,
  submitDigitalCertificateAppeal,
  upholdDigitalCertificateAppeal,
} from "@/server/services/certificate.service";

async function getAuthenticatedAssessmentContext(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function assessmentRedirect(locale: Locale, status: string, assessmentId?: string): never {
  const suffix = assessmentId ? `&assessmentId=${assessmentId}` : "";
  redirect(`/${locale}/dashboard/certification?status=${status}${suffix}`);
}

export type AssessmentInlineActionResult =
  | {
      ok: true;
      status:
        | "assessor-designation-saved"
        | "assessment-assignment-saved"
        | "assessment-assignment-cancelled";
    }
  | {
      ok: false;
      status:
        | "auth-required"
        | "assessor-designation-invalid"
        | "assessor-designation-failed"
        | "assessment-assignment-invalid"
        | "assessment-assignment-failed"
        | "assessment-cancellation-invalid"
        | "assessment-cancellation-failed";
    };

export async function requestLevel2Review(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const parsed = level2ReadinessRequestSchema.safeParse({
    journeyId: formData.get("journeyId"),
  });
  if (!parsed.success) redirect(`/${locale}/dashboard/certification?status=readiness-invalid`);

  try {
    await submitLevel2ReadinessRequest(supabase, user.id, parsed.data.journeyId);
  } catch {
    redirect(`/${locale}/dashboard/certification?status=readiness-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=readiness-requested`);
}

export async function decideLevel2Review(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const rawReason = formData.get("reason");
  const parsed = level2ReadinessDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("decision"),
    reason: typeof rawReason === "string" && rawReason.trim() ? rawReason : null,
  });
  if (!parsed.success) redirect(`/${locale}/dashboard/certification?status=decision-invalid`);

  try {
    await submitLevel2ReadinessDecision(supabase, user.id, {
      requestId: parsed.data.requestId,
      status: parsed.data.status as "approved" | "rejected" | "revision_required",
      reason: parsed.data.reason,
    });
  } catch {
    redirect(`/${locale}/dashboard/certification?status=decision-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=decision-saved`);
}

export async function overrideCertification(locale: Locale, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login?status=auth-required`);

  const parsed = certificationOverrideSchema.safeParse({
    journeyId: formData.get("journeyId"),
    expectedState: formData.get("expectedState"),
    resultingState: formData.get("resultingState"),
    reason: formData.get("reason"),
    evidenceReference: formData.get("evidenceReference"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/dashboard/certification?status=override-invalid`);
  }

  const roles = await listUserRoles(supabase, user.id);
  if (!hasPermission(roles, "certifications:approve")) {
    redirect(`/${locale}/dashboard/certification?status=override-forbidden`);
  }

  try {
    await overrideCertificationState(supabase, user.id, parsed.data);
  } catch {
    redirect(`/${locale}/dashboard/certification?status=override-failed`);
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  redirect(`/${locale}/dashboard/certification?status=override-saved`);
}

export async function requestAssessmentReview(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = assessmentReadinessRequestSchema.safeParse({ journeyId: formData.get("journeyId") });
  if (!parsed.success) assessmentRedirect(locale, "assessment-readiness-invalid");
  try { await submitAssessmentReadinessRequest(supabase, user.id, parsed.data.journeyId); }
  catch { assessmentRedirect(locale, "assessment-readiness-failed"); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-readiness-requested");
}

export async function decideAssessmentReview(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const rawReason = formData.get("reason");
  const parsed = assessmentReadinessDecisionSchema.safeParse({
    requestId: formData.get("requestId"), approve: formData.get("decision"),
    reason: typeof rawReason === "string" && rawReason.trim() ? rawReason : null,
  });
  if (!parsed.success) assessmentRedirect(locale, "assessment-decision-invalid");
  try { await submitAssessmentReadinessDecision(supabase, user.id, parsed.data.requestId, parsed.data.approve === "approved", parsed.data.reason); }
  catch { assessmentRedirect(locale, "assessment-decision-failed"); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-decision-saved");
}

export async function manageAssessorDesignation(locale: Locale, formData: FormData) {
  const result = await manageAssessorDesignationInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  assessmentRedirect(locale, result.status);
}

export async function manageAssessorDesignationInline(
  locale: Locale,
  formData: FormData
): Promise<AssessmentInlineActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: "auth-required" };

  const parsed = assessorDesignationSchema.safeParse({ userId: formData.get("userId"), active: formData.get("active"), reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, status: "assessor-designation-invalid" };
  try { await updateAssessorDesignation(supabase, user.id, parsed.data.userId, parsed.data.active === "true", parsed.data.reason); }
  catch { return { ok: false, status: "assessor-designation-failed" }; }
  revalidatePath(`/${locale}/dashboard/certification`);
  return { ok: true, status: "assessor-designation-saved" };
}

export async function assignAssessment(locale: Locale, formData: FormData) {
  const result = await assignAssessmentInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  const assessmentId = formData.get("assessmentId");
  assessmentRedirect(
    locale,
    result.status,
    typeof assessmentId === "string" ? assessmentId : undefined
  );
}

export async function assignAssessmentInline(
  locale: Locale,
  formData: FormData
): Promise<AssessmentInlineActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: "auth-required" };

  const parsed = assessmentAssignmentSchema.safeParse({ assessmentId: formData.get("assessmentId"), assessorUserId: formData.get("assessorUserId") });
  if (!parsed.success) return { ok: false, status: "assessment-assignment-invalid" };
  try { await submitAssessmentAssessor(supabase, user.id, parsed.data.assessmentId, parsed.data.assessorUserId); }
  catch { return { ok: false, status: "assessment-assignment-failed" }; }
  revalidatePath(`/${locale}/dashboard/certification`);
  return { ok: true, status: "assessment-assignment-saved" };
}

export async function cancelAssessmentAssignmentInline(
  locale: Locale,
  formData: FormData
): Promise<AssessmentInlineActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: "auth-required" };

  const parsed = assessmentAssignmentCancellationSchema.safeParse({
    assessmentId: formData.get("assessmentId"),
  });
  if (!parsed.success) return { ok: false, status: "assessment-cancellation-invalid" };

  try {
    await submitAssessmentAssessorCancellation(
      supabase,
      user.id,
      parsed.data.assessmentId
    );
  } catch {
    return { ok: false, status: "assessment-cancellation-failed" };
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  return { ok: true, status: "assessment-assignment-cancelled" };
}

export async function scheduleAssessmentAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = assessmentScheduleSchema.safeParse({ assessmentId: formData.get("assessmentId"), scheduledAt: formData.get("scheduledAt") });
  if (!parsed.success) assessmentRedirect(locale, "assessment-schedule-invalid");
  try { await submitAssessmentSchedule(supabase, user.id, parsed.data.assessmentId, parsed.data.scheduledAt.toISOString()); }
  catch { assessmentRedirect(locale, "assessment-schedule-failed", parsed.data.assessmentId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-schedule-saved", parsed.data.assessmentId);
}

export async function recordAssessmentOutcomeAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const rawNotes = formData.get("notes");
  const rawNextAction = formData.get("nextAction");
  const parsed = assessmentOutcomeSchema.safeParse({ assessmentId: formData.get("assessmentId"), status: formData.get("outcome"),
    notes: typeof rawNotes === "string" && rawNotes.trim() ? rawNotes : null,
    nextAction: typeof rawNextAction === "string" && rawNextAction.trim() ? rawNextAction : null });
  if (!parsed.success) assessmentRedirect(locale, "assessment-outcome-invalid");
  try { await submitAssessmentOutcome(supabase, user.id, parsed.data.assessmentId, parsed.data.status as AssessmentStatus, parsed.data.notes, parsed.data.nextAction); }
  catch { assessmentRedirect(locale, "assessment-outcome-failed", parsed.data.assessmentId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-outcome-saved", parsed.data.assessmentId);
}

export async function verifyAssessmentRemediationAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = assessmentRemediationSchema.safeParse({ assessmentId: formData.get("assessmentId") });
  if (!parsed.success) assessmentRedirect(locale, "assessment-remediation-invalid");
  try { await submitAssessmentRemediationVerification(supabase, user.id, parsed.data.assessmentId); }
  catch { assessmentRedirect(locale, "assessment-remediation-failed", parsed.data.assessmentId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-remediation-saved");
}

function certificateRedirect(locale: Locale, status: string, certificateId?: string): never {
  const suffix = certificateId ? `&certificateId=${certificateId}` : "";
  redirect(`/${locale}/dashboard/certification?status=${status}${suffix}`);
}

function certificateFailureStatus(error: unknown) {
  return error instanceof CertificateTemplateNotConfiguredError
    ? "certificate-template-unconfigured"
    : "certificate-action-failed";
}

export type CertificateIssueInlineActionResult =
  | { ok: true; status: "certificate-issued" }
  | {
      ok: false;
      status:
        | "auth-required"
        | "certificate-action-invalid"
        | "certificate-template-unconfigured"
        | "certificate-action-failed";
      message: string | null;
    };

export async function issueCertificateInline(
  locale: Locale,
  formData: FormData
): Promise<CertificateIssueInlineActionResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: "auth-required", message: null };
  }

  const parsed = certificateIssueSchema.safeParse({ journeyId: formData.get("journeyId") });
  if (!parsed.success) {
    return { ok: false, status: "certificate-action-invalid", message: null };
  }

  try {
    await issueDigitalCertificate(supabase, user.id, parsed.data.journeyId);
  } catch (error) {
    console.error("Certificate issuance failed.", {
      journeyId: parsed.data.journeyId,
      error: error instanceof Error ? error.message : "Unknown certificate issuance error",
    });
    return {
      ok: false,
      status: certificateFailureStatus(error),
      message: error instanceof Error ? error.message : null,
    };
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  return { ok: true, status: "certificate-issued" };
}

export async function issueCertificateAction(locale: Locale, formData: FormData) {
  const result = await issueCertificateInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  certificateRedirect(locale, result.status);
}

export async function replaceCertificateAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const rawRequestId = formData.get("requestId");
  const parsed = certificateReplacementSchema.safeParse({
    certificateId: formData.get("certificateId"),
    requestId: typeof rawRequestId === "string" && rawRequestId ? rawRequestId : null,
    reason: formData.get("reason"),
  });
  if (!parsed.success) certificateRedirect(locale, "certificate-action-invalid");
  try { await replaceDigitalCertificate(supabase, user.id, parsed.data.certificateId, parsed.data.reason, parsed.data.requestId); }
  catch (error) { certificateRedirect(locale, certificateFailureStatus(error), parsed.data.certificateId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  certificateRedirect(locale, "certificate-replaced");
}

export async function revokeCertificateAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = certificateRevocationSchema.safeParse({
    certificateId: formData.get("certificateId"), reason: formData.get("reason"),
    evidenceReference: formData.get("evidenceReference"),
  });
  if (!parsed.success) certificateRedirect(locale, "certificate-action-invalid");
  try { await revokeDigitalCertificate(supabase, user.id, parsed.data.certificateId, parsed.data.reason, parsed.data.evidenceReference); }
  catch { certificateRedirect(locale, "certificate-action-failed", parsed.data.certificateId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  certificateRedirect(locale, "certificate-revoked");
}

export async function requestCertificateReplacementAction(locale: Locale, formData: FormData) {
  const result = await requestCertificateReplacementInline(locale, formData);
  if (!result.ok && result.status === "auth-required") {
    redirect(`/${locale}/login?status=auth-required`);
  }
  const certificateId = formData.get("certificateId");
  certificateRedirect(
    locale,
    result.status,
    typeof certificateId === "string" ? certificateId : undefined
  );
}

export type CertificateReplacementRequestInlineResult =
  | { ok: true; status: "certificate-replacement-requested" }
  | {
      ok: false;
      status: "auth-required" | "certificate-action-invalid" | "certificate-action-failed";
    };

export async function requestCertificateReplacementInline(
  locale: Locale,
  formData: FormData
): Promise<CertificateReplacementRequestInlineResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: "auth-required" };

  const parsed = certificateReplacementRequestSchema.safeParse({ certificateId: formData.get("certificateId"), reason: formData.get("reason") });
  if (!parsed.success) return { ok: false, status: "certificate-action-invalid" };

  try {
    await requestDigitalCertificateReplacement(
      supabase,
      user.id,
      parsed.data.certificateId,
      parsed.data.reason
    );
  } catch (error) {
    console.error("Certificate replacement request failed.", {
      certificateId: parsed.data.certificateId,
      error: error instanceof Error ? error.message : "Unknown replacement request error",
    });
    return { ok: false, status: "certificate-action-failed" };
  }

  revalidatePath(`/${locale}/dashboard/certification`);
  return { ok: true, status: "certificate-replacement-requested" };
}

export async function rejectCertificateReplacementAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = certificateReplacementRejectionSchema.safeParse({ requestId: formData.get("requestId"), reason: formData.get("reason") });
  if (!parsed.success) certificateRedirect(locale, "certificate-action-invalid");
  try { await rejectDigitalCertificateReplacement(supabase, user.id, parsed.data.requestId, parsed.data.reason); }
  catch { certificateRedirect(locale, "certificate-action-failed"); }
  revalidatePath(`/${locale}/dashboard/certification`);
  certificateRedirect(locale, "certificate-replacement-rejected");
}

export async function submitCertificateAppealAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const evidence = formData.get("evidenceReference");
  const parsed = certificateAppealSchema.safeParse({ certificateId: formData.get("certificateId"), reason: formData.get("reason"),
    evidenceReference: typeof evidence === "string" && evidence.trim() ? evidence : null });
  if (!parsed.success) certificateRedirect(locale, "certificate-action-invalid");
  try { await submitDigitalCertificateAppeal(supabase, user.id, parsed.data.certificateId, parsed.data.reason, parsed.data.evidenceReference); }
  catch { certificateRedirect(locale, "certificate-action-failed", parsed.data.certificateId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  certificateRedirect(locale, "certificate-appeal-submitted");
}

export async function decideCertificateAppealAction(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = certificateAppealDecisionSchema.safeParse({ appealId: formData.get("appealId"), decision: formData.get("decision"), reason: formData.get("reason") });
  if (!parsed.success) certificateRedirect(locale, "certificate-action-invalid");
  try {
    if (parsed.data.decision === "reinstated") await reinstateDigitalCertificate(supabase, user.id, parsed.data.appealId, parsed.data.reason);
    else await upholdDigitalCertificateAppeal(supabase, user.id, parsed.data.appealId, parsed.data.reason);
  } catch (error) { certificateRedirect(locale, certificateFailureStatus(error)); }
  revalidatePath(`/${locale}/dashboard/certification`);
  certificateRedirect(locale, parsed.data.decision === "reinstated" ? "certificate-reinstated" : "certificate-appeal-upheld");
}

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
  assessmentScheduleSchema,
  assessmentOutcomeSchema,
  assessmentRemediationSchema,
} from "@/server/validators/certification.schema";
import type { AssessmentStatus } from "@/server/models/certification.model";

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
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = assessorDesignationSchema.safeParse({ userId: formData.get("userId"), active: formData.get("active"), reason: formData.get("reason") });
  if (!parsed.success) assessmentRedirect(locale, "assessor-designation-invalid");
  try { await updateAssessorDesignation(supabase, user.id, parsed.data.userId, parsed.data.active === "true", parsed.data.reason); }
  catch { assessmentRedirect(locale, "assessor-designation-failed"); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessor-designation-saved");
}

export async function assignAssessment(locale: Locale, formData: FormData) {
  const { supabase, user } = await getAuthenticatedAssessmentContext(locale);
  const parsed = assessmentAssignmentSchema.safeParse({ assessmentId: formData.get("assessmentId"), assessorUserId: formData.get("assessorUserId") });
  if (!parsed.success) assessmentRedirect(locale, "assessment-assignment-invalid");
  try { await submitAssessmentAssessor(supabase, user.id, parsed.data.assessmentId, parsed.data.assessorUserId); }
  catch { assessmentRedirect(locale, "assessment-assignment-failed", parsed.data.assessmentId); }
  revalidatePath(`/${locale}/dashboard/certification`);
  assessmentRedirect(locale, "assessment-assignment-saved", parsed.data.assessmentId);
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

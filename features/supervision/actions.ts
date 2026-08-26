"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignInstructorAsAdmin,
  endMySupervision,
  requestMyInstructor,
  reviewInstructorRequest,
} from "@/server/services/supervision.service";
import {
  supervisionAdminAssignSchema,
  supervisionEndSchema,
  supervisionRequestSchema,
  supervisionResponseSchema,
} from "@/server/validators/supervision.schema";

export type InstructorRequestActionResult =
  | { ok: true; status: "requested" }
  | { ok: false; status: "invalid" | "alreadyPending" | "error" };

export type RelationshipActionResult =
  | { ok: true; status: "accepted" | "declined" | "cancelled" | "ended" }
  | { ok: false; status: "invalid" | "error" };

function isPendingRequestConflict(error: unknown) {
  return error instanceof Error && error.message.includes("supervision_one_pending_request_idx");
}

function refreshSupervision(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/supervision`);
  revalidatePath(`/${locale}/dashboard/first-steps`);
}

async function requireUser(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function finish(locale: Locale, status: string): never {
  revalidatePath(`/${locale}/dashboard/supervision`);
  revalidatePath(`/${locale}/dashboard/first-steps`);
  redirect(`/${locale}/dashboard/supervision?status=${status}`);
}

export async function requestInstructor(
  locale: Locale,
  formData: FormData
): Promise<InstructorRequestActionResult> {
  const parsed = supervisionRequestSchema.safeParse({
    instructorUserId: formData.get("instructorUserId"),
  });
  if (!parsed.success) return { ok: false, status: "invalid" };

  const { supabase, user } = await requireUser(locale);
  try {
    await requestMyInstructor(supabase, user.id, parsed.data.instructorUserId);
    refreshSupervision(locale);
    return { ok: true, status: "requested" };
  } catch (error) {
    return {
      ok: false,
      status: isPendingRequestConflict(error) ? "alreadyPending" : "error",
    };
  }
}

export async function respondInstructorRequest(
  locale: Locale,
  formData: FormData
): Promise<RelationshipActionResult> {
  const parsed = supervisionResponseSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) return { ok: false, status: "invalid" };

  const { supabase, user } = await requireUser(locale);
  try {
    await reviewInstructorRequest(
      supabase,
      user.id,
      parsed.data.assignmentId,
      parsed.data.decision === "accept"
    );
    refreshSupervision(locale);
    return {
      ok: true,
      status: parsed.data.decision === "accept" ? "accepted" : "declined",
    };
  } catch {
    return { ok: false, status: "error" };
  }
}

export async function endInstructorAssignment(
  locale: Locale,
  formData: FormData
): Promise<RelationshipActionResult> {
  const parsed = supervisionEndSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, status: "invalid" };

  const { supabase, user } = await requireUser(locale);
  try {
    await endMySupervision(supabase, user.id, parsed.data.assignmentId, parsed.data.reason);
    refreshSupervision(locale);
    return { ok: true, status: "ended" };
  } catch {
    return { ok: false, status: "error" };
  }
}

export async function cancelInstructorRequest(
  locale: Locale,
  formData: FormData
): Promise<RelationshipActionResult> {
  const parsed = supervisionEndSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    reason: "",
  });
  if (!parsed.success) return { ok: false, status: "invalid" };

  const { supabase, user } = await requireUser(locale);
  try {
    await endMySupervision(supabase, user.id, parsed.data.assignmentId, "");
    refreshSupervision(locale);
    return { ok: true, status: "cancelled" };
  } catch {
    return { ok: false, status: "error" };
  }
}

export async function adminAssignInstructorAction(locale: Locale, formData: FormData) {
  const parsed = supervisionAdminAssignSchema.safeParse({
    traineeUserId: formData.get("traineeUserId"),
    instructorUserId: formData.get("instructorUserId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await assignInstructorAsAdmin(
    supabase,
    user.id,
    parsed.data.traineeUserId,
    parsed.data.instructorUserId,
    parsed.data.reason
  );
  finish(locale, "assigned");
}

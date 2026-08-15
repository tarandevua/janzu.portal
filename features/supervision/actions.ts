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

export async function requestInstructor(locale: Locale, formData: FormData) {
  const parsed = supervisionRequestSchema.safeParse({
    instructorUserId: formData.get("instructorUserId"),
  });
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await requestMyInstructor(supabase, user.id, parsed.data.instructorUserId);
  finish(locale, "requested");
}

export async function respondInstructorRequest(locale: Locale, formData: FormData) {
  const parsed = supervisionResponseSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await reviewInstructorRequest(
    supabase,
    user.id,
    parsed.data.assignmentId,
    parsed.data.decision === "accept"
  );
  finish(locale, parsed.data.decision === "accept" ? "accepted" : "declined");
}

export async function endInstructorAssignment(locale: Locale, formData: FormData) {
  const parsed = supervisionEndSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await endMySupervision(supabase, user.id, parsed.data.assignmentId, parsed.data.reason);
  finish(locale, "ended");
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

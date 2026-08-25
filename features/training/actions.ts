"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  correctMyTrainingRecord,
  reviewTraineeTrainingRecord,
  submitMyTrainingRecord,
} from "@/server/services/training.service";
import {
  trainingCorrectionSchema,
  trainingRecordSchema,
  trainingReviewSchema,
} from "@/server/validators/training.schema";

export type TrainingActionState = {
  ok: boolean;
  status: "idle" | "submitted" | "corrected" | "verified" | "rejected" | "invalid" | "error";
  resultId: string | null;
};

function result(ok: boolean, status: TrainingActionState["status"]): TrainingActionState {
  return { ok, status, resultId: randomUUID() };
}

async function requireUser(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function refreshTraining(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/training`);
  revalidatePath(`/${locale}/dashboard/first-steps`);
}

export async function submitTrainingRecord(
  locale: Locale,
  _previousState: TrainingActionState,
  formData: FormData
): Promise<TrainingActionState> {
  const input = {
    level: formData.get("level"),
    cohort: formData.get("cohort"),
    location: formData.get("location"),
    startedOn: formData.get("startedOn"),
    completedOn: formData.get("completedOn"),
    teachingInstructorName: formData.get("teachingInstructorName"),
    courseworkComplete: formData.get("courseworkComplete") ? "true" : "false",
    evidenceReference: formData.get("evidenceReference"),
    notes: formData.get("notes"),
  };
  const parsed = trainingRecordSchema.safeParse(input);
  if (!parsed.success) return result(false, "invalid");

  const { supabase, user } = await requireUser(locale);
  try {
    await submitMyTrainingRecord(supabase, user.id, parsed.data);
    refreshTraining(locale);
    return result(true, "submitted");
  } catch {
    return result(false, "error");
  }
}

export async function correctTraining(
  locale: Locale,
  _previousState: TrainingActionState,
  formData: FormData
): Promise<TrainingActionState> {
  const parsed = trainingCorrectionSchema.safeParse({
    recordId: formData.get("recordId"),
    level: formData.get("level"),
    cohort: formData.get("cohort"),
    location: formData.get("location"),
    startedOn: formData.get("startedOn"),
    completedOn: formData.get("completedOn"),
    teachingInstructorName: formData.get("teachingInstructorName"),
    courseworkComplete: formData.get("courseworkComplete") ? "true" : "false",
    evidenceReference: formData.get("evidenceReference"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return result(false, "invalid");

  const { supabase, user } = await requireUser(locale);
  try {
    await correctMyTrainingRecord(supabase, user.id, parsed.data.recordId, parsed.data);
    refreshTraining(locale);
    return result(true, "corrected");
  } catch {
    return result(false, "error");
  }
}

export async function reviewTraining(
  locale: Locale,
  _previousState: TrainingActionState,
  formData: FormData
): Promise<TrainingActionState> {
  const parsed = trainingReviewSchema.safeParse({
    recordId: formData.get("recordId"),
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return result(false, "invalid");

  const { supabase, user } = await requireUser(locale);
  try {
    await reviewTraineeTrainingRecord(
      supabase,
      user.id,
      parsed.data.recordId,
      parsed.data.decision === "approve",
      parsed.data.reason
    );
    refreshTraining(locale);
    return result(true, parsed.data.decision === "approve" ? "verified" : "rejected");
  } catch {
    return result(false, "error");
  }
}

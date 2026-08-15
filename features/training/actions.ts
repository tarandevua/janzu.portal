"use server";

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

async function requireUser(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function finish(locale: Locale, status: string, traineeId?: string): never {
  revalidatePath(`/${locale}/dashboard/training`);
  revalidatePath(`/${locale}/dashboard/first-steps`);
  const query = new URLSearchParams({ status });
  if (traineeId) query.set("traineeId", traineeId);
  redirect(`/${locale}/dashboard/training?${query.toString()}`);
}

export async function submitTrainingRecord(locale: Locale, formData: FormData) {
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
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await submitMyTrainingRecord(supabase, user.id, parsed.data);
  finish(locale, "submitted");
}

export async function correctTraining(locale: Locale, formData: FormData) {
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
  if (!parsed.success) finish(locale, "invalid");

  const { supabase, user } = await requireUser(locale);
  await correctMyTrainingRecord(supabase, user.id, parsed.data.recordId, parsed.data);
  finish(locale, "corrected");
}

export async function reviewTraining(locale: Locale, formData: FormData) {
  const parsed = trainingReviewSchema.safeParse({
    recordId: formData.get("recordId"),
    decision: formData.get("decision"),
    reason: formData.get("reason"),
  });
  const traineeId = typeof formData.get("traineeId") === "string"
    ? String(formData.get("traineeId"))
    : undefined;
  if (!parsed.success) finish(locale, "invalid", traineeId);

  const { supabase, user } = await requireUser(locale);
  await reviewTraineeTrainingRecord(
    supabase,
    user.id,
    parsed.data.recordId,
    parsed.data.decision === "approve",
    parsed.data.reason
  );
  finish(locale, parsed.data.decision === "approve" ? "verified" : "rejected", traineeId);
}

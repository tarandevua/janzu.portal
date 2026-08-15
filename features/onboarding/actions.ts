"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateGuideCompletion,
  updateLearningAlliance,
} from "@/server/services/onboarding.service";

async function requireUser(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?status=auth-required`);
  return { supabase, user };
}

function finish(locale: Locale, status: string): never {
  revalidatePath(`/${locale}/dashboard/first-steps`);
  revalidatePath(`/${locale}/dashboard/apprentice`);
  redirect(`/${locale}/dashboard/first-steps?status=${status}`);
}

export async function setLearningAlliance(locale: Locale, formData: FormData) {
  const action = z.enum(["accept", "revoke"]).safeParse(formData.get("action"));
  if (!action.success) finish(locale, "invalid");
  const { supabase, user } = await requireUser(locale);
  await updateLearningAlliance(supabase, user.id, locale, action.data === "accept");
  finish(locale, action.data === "accept" ? "alliance-accepted" : "alliance-revoked");
}

export async function setGuideComplete(locale: Locale, formData: FormData) {
  const parsed = z.object({
    guideKey: z.enum(["calendar", "sessions", "feedback"]),
    complete: z.enum(["true", "false"]).transform((value) => value === "true"),
  }).safeParse({
    guideKey: formData.get("guideKey"),
    complete: formData.get("complete"),
  });
  if (!parsed.success) finish(locale, "invalid");
  const { supabase, user } = await requireUser(locale);
  await updateGuideCompletion(supabase, user.id, parsed.data.guideKey, parsed.data.complete);
  finish(locale, "guide-updated");
}

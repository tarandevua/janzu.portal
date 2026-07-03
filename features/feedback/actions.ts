"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMySessionFeedbackLink, submitPublicFeedback } from "@/server/services/feedback.service";
import { feedbackSchema, feedbackTokenSchema } from "@/server/validators/feedback.schema";

export async function createFeedbackLink(locale: Locale, formData: FormData) {
  const sessionId = formData.get("sessionId");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  if (typeof sessionId !== "string" || !sessionId) {
    redirect(`/${locale}/dashboard/sessions?status=feedback-invalid`);
  }

  await createMySessionFeedbackLink(supabase, user.id, sessionId);

  revalidatePath(`/${locale}/dashboard/sessions`);
  redirect(`/${locale}/dashboard/sessions?status=feedback-created`);
}

export async function submitFeedbackForm(locale: Locale, token: string, formData: FormData) {
  const tokenResult = feedbackTokenSchema.safeParse(token);

  if (!tokenResult.success) {
    redirect(`/${locale}/feedback/${token}?status=invalid`);
  }

  const parsed = feedbackSchema.safeParse({
    participantEmail: formData.get("participantEmail"),
    rating: formData.get("rating"),
    experienceText: formData.get("experienceText"),
    emotionalImpact: formData.get("emotionalImpact"),
    feltInFacilitatorArms: formData.get("feltInFacilitatorArms"),
    supportAtEnd: formData.get("supportAtEnd"),
    supportOtherText: formData.get("supportOtherText"),
    continueWaterProcess: formData.get("continueWaterProcess"),
    interestedLearningJanzu: formData.get("interestedLearningJanzu") === "on",
    learningName: formData.get("learningName"),
    learningPhone: formData.get("learningPhone"),
    anythingElse: formData.get("anythingElse"),
    gdprAgreed: formData.get("gdprAgreed") === "on",
  });

  if (!parsed.success) {
    redirect(`/${locale}/feedback/${token}?status=invalid`);
  }

  const supabase = await createSupabaseServerClient();
  await submitPublicFeedback(supabase, tokenResult.data, parsed.data);

  redirect(`/${locale}/feedback/${token}?status=submitted`);
}

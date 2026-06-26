import { notFound } from "next/navigation";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findFeedbackStatusByToken } from "@/server/services/feedback.service";
import { feedbackTokenSchema } from "@/server/validators/feedback.schema";

type FeedbackPageProps = {
  params: Promise<{ locale: Locale; token: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function FeedbackPage({ params, searchParams }: FeedbackPageProps) {
  const [{ locale, token }, { status }] = await Promise.all([params, searchParams]);
  const tokenResult = feedbackTokenSchema.safeParse(token);

  if (!tokenResult.success) {
    notFound();
  }

  const [dictionary, supabase] = await Promise.all([
    getDictionary(locale),
    createSupabaseServerClient(),
  ]);
  let feedbackStatus = null;

  try {
    feedbackStatus = await findFeedbackStatusByToken(supabase, tokenResult.data);
  } catch {
    notFound();
  }

  if (!feedbackStatus) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-muted/40 p-6">
      <FeedbackForm
        locale={locale}
        token={tokenResult.data}
        status={status}
        dictionary={dictionary.feedback}
        isSubmitted={feedbackStatus.submittedAt !== null || status === "submitted"}
      />
    </main>
  );
}

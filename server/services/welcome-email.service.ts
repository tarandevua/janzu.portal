import "server-only";

import type { Locale } from "@/lib/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WelcomeEmailDelivery, WelcomeEmailResult } from "@/server/models/welcome-email.model";
import {
  claimWelcomeEmailDelivery,
  recordWelcomeEmailResult,
} from "@/server/repositories/welcome-email.repository";
import {
  EmailDeliveryError,
  sendWelcomeEmail,
} from "@/server/services/email.service";

function logWelcomeDelivery(
  delivery: Pick<WelcomeEmailDelivery, "id" | "userId" | "attemptCount">,
  outcome: string,
  failureCode?: string
) {
  console.info({
    eventType: "welcome.activated",
    deliveryId: delivery.id,
    userId: delivery.userId,
    attempt: delivery.attemptCount,
    outcome,
    ...(failureCode ? { failureCode } : {}),
  });
}

type WelcomeEmailFailureResult = Extract<WelcomeEmailResult, { succeeded: false }>;

function toFailureResult(error: unknown): WelcomeEmailFailureResult {
  if (error instanceof EmailDeliveryError) {
    return {
      succeeded: false,
      failureCode: error.code,
      failureMessage: error.message,
      retryable: error.retryable,
    };
  }

  return {
    succeeded: false,
    failureCode: "welcome_email_unexpected_error",
    failureMessage: "Welcome email delivery failed unexpectedly.",
    retryable: true,
  };
}

export async function claimWelcomeEmailForActivatedUser(userId: string, locale: Locale) {
  try {
    const admin = createSupabaseAdminClient();
    return await claimWelcomeEmailDelivery(admin, userId, locale);
  } catch {
    console.error({
      eventType: "welcome.activated",
      userId,
      outcome: "claim_failed",
    });
    return null;
  }
}

export async function deliverClaimedWelcomeEmail(delivery: WelcomeEmailDelivery) {
  try {
    const admin = createSupabaseAdminClient();
    const providerMessageId = await sendWelcomeEmail({
      toEmail: delivery.recipientEmail,
      toName: delivery.recipientName,
      locale: delivery.locale,
      roles: delivery.roleNames,
    });
    await recordWelcomeEmailResult(admin, delivery.id, {
      succeeded: true,
      providerMessageId,
    });
    logWelcomeDelivery(delivery, "provider_accepted");
  } catch (error) {
    const result = toFailureResult(error);

    try {
      const admin = createSupabaseAdminClient();
      await recordWelcomeEmailResult(admin, delivery.id, result);
      logWelcomeDelivery(delivery, "failed", result.failureCode);
    } catch {
      logWelcomeDelivery(delivery, "result_recording_failed");
    }
  }
}

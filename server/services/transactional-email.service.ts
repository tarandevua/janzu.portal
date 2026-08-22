import "server-only";

import { timingSafeEqual } from "node:crypto";
import { getEmailEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  EmailPreference,
  EnqueueTransactionalEmailInput,
  TransactionalEmailDelivery,
  TransactionalEmailResult,
} from "@/server/models/transactional-email.model";
import {
  claimTransactionalEmailDeliveries,
  enqueueTransactionalEmailDelivery,
  listEmailPreferences,
  recordTransactionalEmailResult,
  recordTransactionalEmailWebhook,
  saveEmailPreferences,
} from "@/server/repositories/transactional-email.repository";
import {
  EmailDeliveryError,
  sendTransactionalEmailMessage,
} from "@/server/services/email.service";
import {
  assertAuthorizedEmailDestination,
  assertSafeEmailMetadata,
  buildTransactionalEmailTemplate,
} from "@/server/services/transactional-email-template";

export function getMyEmailPreferences(supabase: SupabaseServerClient, userId: string) {
  return listEmailPreferences(supabase, userId);
}

export function updateMyEmailPreferences(
  supabase: SupabaseServerClient,
  userId: string,
  preferences: EmailPreference[]
) {
  return saveEmailPreferences(supabase, userId, preferences);
}

export async function enqueueTransactionalEmail(input: EnqueueTransactionalEmailInput) {
  assertSafeEmailMetadata(input.metadata);
  assertAuthorizedEmailDestination(input.eventType, input.locale, input.destinationPath);
  if (input.required === Boolean(input.preferenceKey)) {
    throw new Error("Required messages cannot use preferences; optional messages must use one.");
  }
  return enqueueTransactionalEmailDelivery(createSupabaseAdminClient(), input);
}

function normalizeProviderMessageId(value: string | null) {
  return value?.trim().replace(/^<|>$/g, "") ?? null;
}

function toFailureResult(error: unknown): TransactionalEmailResult {
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
    failureCode: "transactional_email_unexpected_error",
    failureMessage: "Transactional email delivery failed unexpectedly.",
    retryable: true,
  };
}

async function deliverOne(delivery: TransactionalEmailDelivery) {
  const admin = createSupabaseAdminClient();
  let result: TransactionalEmailResult;

  try {
    const siteUrl = getEmailEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const template = buildTransactionalEmailTemplate({
      eventType: delivery.eventType,
      locale: delivery.locale,
      displayName: delivery.recipientName ?? delivery.recipientEmail,
      destinationUrl: `${siteUrl}${delivery.destinationPath}`,
      metadata: delivery.eventMetadata,
    });
    result = {
      succeeded: true,
      providerMessageId: normalizeProviderMessageId(
        await sendTransactionalEmailMessage({
          toEmail: delivery.recipientEmail,
          toName: delivery.recipientName ?? delivery.recipientEmail,
          deliveryId: delivery.id,
          ...template,
        })
      ),
    };
  } catch (error) {
    result = toFailureResult(error);
  }

  await recordTransactionalEmailResult(admin, delivery.id, result);
  console.info({
    eventType: delivery.eventType,
    deliveryId: delivery.id,
    recipientUserId: delivery.recipientUserId,
    attempt: delivery.attemptCount,
    outcome: result.succeeded ? "provider_accepted" : "failed",
    ...(!result.succeeded ? { failureCode: result.failureCode } : {}),
  });
}

export async function processTransactionalEmailBatch(batchSize = 10) {
  const deliveries = await claimTransactionalEmailDeliveries(
    createSupabaseAdminClient(),
    batchSize
  );
  await Promise.all(deliveries.map(deliverOne));
  return deliveries.length;
}

export function secureSecretMatches(provided: string | null, expected: string) {
  if (!provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function recordProviderWebhook(input: {
  providerMessageId: string;
  event: string;
  failureCode: string | null;
}) {
  const providerMessageId = normalizeProviderMessageId(input.providerMessageId);
  if (!providerMessageId) return Promise.resolve();
  return recordTransactionalEmailWebhook(
    createSupabaseAdminClient(),
    providerMessageId,
    input.event,
    input.failureCode
  );
}

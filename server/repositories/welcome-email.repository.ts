import "server-only";

import type { Locale } from "@/lib/i18n/config";
import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type { WelcomeEmailDelivery, WelcomeEmailResult } from "@/server/models/welcome-email.model";
import { normalizeRoles } from "@/server/services/rbac.service";
import type { Database } from "@/types/database";

type WelcomeDeliveryRow = Database["public"]["Tables"]["welcome_email_deliveries"]["Row"];
type ClaimArgs = Database["public"]["Functions"]["claim_welcome_email_delivery"]["Args"];
type RecordResultArgs = Database["public"]["Functions"]["record_welcome_email_result"]["Args"];

type WelcomeEmailRpcClient = {
  rpc(
    functionName: "claim_welcome_email_delivery",
    args: ClaimArgs
  ): Promise<{ data: WelcomeDeliveryRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "record_welcome_email_result",
    args: RecordResultArgs
  ): Promise<{ data: undefined | null; error: { message: string } | null }>;
};

function toWelcomeEmailDelivery(row: WelcomeDeliveryRow): WelcomeEmailDelivery {
  return {
    id: row.id,
    userId: row.user_id,
    idempotencyKey: row.idempotency_key,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    locale: row.locale,
    roleNames: normalizeRoles(row.role_names),
    templateVersion: row.template_version,
    status: row.status,
    attemptCount: row.attempt_count,
  };
}

export async function claimWelcomeEmailDelivery(
  admin: SupabaseAdminClient,
  userId: string,
  locale: Locale
): Promise<WelcomeEmailDelivery | null> {
  const rpcClient = admin as unknown as WelcomeEmailRpcClient;
  const { data, error } = await rpcClient.rpc("claim_welcome_email_delivery", {
    target_user_id: userId,
    target_locale: locale,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = data?.[0];
  return row ? toWelcomeEmailDelivery(row) : null;
}

export async function recordWelcomeEmailResult(
  admin: SupabaseAdminClient,
  deliveryId: string,
  result: WelcomeEmailResult
) {
  const rpcClient = admin as unknown as WelcomeEmailRpcClient;
  const args: RecordResultArgs = result.succeeded
    ? {
        target_delivery_id: deliveryId,
        target_succeeded: true,
        target_provider_message_id: result.providerMessageId,
      }
    : {
        target_delivery_id: deliveryId,
        target_succeeded: false,
        target_failure_code: result.failureCode,
        target_failure_message: result.failureMessage,
        target_retryable: result.retryable,
      };
  const { error } = await rpcClient.rpc("record_welcome_email_result", args);

  if (error) {
    throw new Error(error.message);
  }
}

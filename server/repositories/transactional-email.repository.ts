import "server-only";

import type { SupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/supabase/server";
import type {
  EmailPreference,
  EnqueueTransactionalEmailInput,
  SafeEmailMetadata,
  TransactionalEmailDelivery,
  TransactionalEmailResult,
} from "@/server/models/transactional-email.model";
import type { Database } from "@/types/database";

type DeliveryRow = Database["public"]["Tables"]["transactional_email_deliveries"]["Row"];
type EventRow = Database["public"]["Tables"]["transactional_email_events"]["Row"];
type PreferenceRow = Database["public"]["Tables"]["email_preferences"]["Row"];

const defaultPreferences: EmailPreference[] = [
  { key: "session_updates", enabled: true },
  { key: "booking_requests", enabled: true },
  { key: "feedback_updates", enabled: true },
  { key: "supervision_updates", enabled: true },
  { key: "certification_decisions", enabled: true },
];

function toDelivery(row: DeliveryRow, event: EventRow): TransactionalEmailDelivery {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: event.event_type,
    eventMetadata: event.metadata as SafeEmailMetadata,
    recipientUserId: row.recipient_user_id,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    locale: row.locale,
    templateKey: row.template_key,
    templateVersion: row.template_version,
    destinationPath: row.destination_path,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    attemptCount: row.attempt_count,
  };
}

export async function listEmailPreferences(
  supabase: SupabaseServerClient,
  userId: string
): Promise<EmailPreference[]> {
  const { data, error } = await supabase
    .from("email_preferences")
    .select("preference_key, enabled")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  const saved = new Map(
    ((data ?? []) as Pick<PreferenceRow, "preference_key" | "enabled">[]).map((row) => [
      row.preference_key,
      row.enabled,
    ])
  );
  return defaultPreferences.map((preference) => ({
    key: preference.key,
    enabled: saved.get(preference.key) ?? true,
  }));
}

export async function saveEmailPreferences(
  supabase: SupabaseServerClient,
  userId: string,
  preferences: EmailPreference[]
) {
  const rows = preferences.map((preference) => ({
    user_id: userId,
    preference_key: preference.key,
    enabled: preference.enabled,
  }));
  const { error } = await supabase
    .from("email_preferences")
    .upsert(rows as never, { onConflict: "user_id,preference_key" });
  if (error) throw new Error(error.message);
}

export async function enqueueTransactionalEmailDelivery(
  admin: SupabaseAdminClient,
  input: EnqueueTransactionalEmailInput
) {
  const { data, error } = await admin.rpc("enqueue_transactional_email", {
    target_event_type: input.eventType,
    target_event_key: input.eventKey,
    target_event_metadata: input.metadata,
    target_occurred_at: input.occurredAt,
    target_recipient_user_id: input.recipientUserId,
    target_locale: input.locale,
    target_template_key: input.eventType,
    target_template_version: "v1",
    target_destination_path: input.destinationPath,
    target_idempotency_key: input.idempotencyKey,
    target_required: input.required,
    target_preference_key: input.preferenceKey ?? null,
  });
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}

export async function claimTransactionalEmailDeliveries(
  admin: SupabaseAdminClient,
  batchSize = 10
): Promise<TransactionalEmailDelivery[]> {
  const { data, error } = await admin.rpc("claim_transactional_email_deliveries", {
    batch_size: batchSize,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as DeliveryRow[];
  if (rows.length === 0) return [];

  const { data: events, error: eventsError } = await admin
    .from("transactional_email_events")
    .select("*")
    .in("id", rows.map((row) => row.event_id));
  if (eventsError) throw new Error(eventsError.message);
  const eventById = new Map(((events ?? []) as EventRow[]).map((event) => [event.id, event]));

  return rows.map((row) => {
    const event = eventById.get(row.event_id);
    if (!event) throw new Error(`Email event ${row.event_id} is unavailable.`);
    return toDelivery(row, event);
  });
}

export async function recordTransactionalEmailResult(
  admin: SupabaseAdminClient,
  deliveryId: string,
  result: TransactionalEmailResult
) {
  const args = result.succeeded
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
  const { error } = await admin.rpc("record_transactional_email_result", args);
  if (error) throw new Error(error.message);
}

export async function recordTransactionalEmailWebhook(
  admin: SupabaseAdminClient,
  providerMessageId: string,
  event: string,
  failureCode: string | null
) {
  const { error } = await admin.rpc("record_transactional_email_webhook", {
    target_provider_message_id: providerMessageId,
    target_event: event,
    target_failure_code: failureCode,
  });
  if (error) throw new Error(error.message);
}

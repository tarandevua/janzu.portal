import type { Locale } from "@/lib/i18n/config";
import type { Role } from "@/server/models/rbac.model";

export type WelcomeEmailDeliveryStatus =
  | "sending"
  | "provider_accepted"
  | "retry_scheduled"
  | "failed_permanent";

export type WelcomeEmailDelivery = {
  id: string;
  userId: string;
  idempotencyKey: string;
  recipientEmail: string;
  recipientName: string | null;
  locale: Locale;
  roleNames: Role[];
  templateVersion: string;
  status: WelcomeEmailDeliveryStatus;
  attemptCount: number;
};

export type WelcomeEmailResult =
  | {
      succeeded: true;
      providerMessageId: string | null;
    }
  | {
      succeeded: false;
      failureCode: string;
      failureMessage: string;
      retryable: boolean;
    };

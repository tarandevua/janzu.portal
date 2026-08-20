import type { Locale } from "@/lib/i18n/config";

export const emailPreferenceKeys = [
  "session_updates",
  "booking_requests",
  "feedback_updates",
  "supervision_updates",
  "certification_decisions",
] as const;

export type EmailPreferenceKey = (typeof emailPreferenceKeys)[number];

export const transactionalEmailEventTypes = [
  "session.registered",
  "booking.requested",
  "feedback.received",
  "session.validated",
  "session.validation_removed",
  "instructor_assignment.requested",
  "instructor_assignment.accepted",
  "instructor_assignment.declined",
  "instructor_assignment.cancelled",
  "instructor_assignment.ended",
  "instructor_assignment.transferred",
  "certification.milestone_25_reached",
  "certification.level_2_readiness_approved",
  "certification.level_2_readiness_rejected",
  "certification.level_2_readiness_revision_required",
  "certification.level_2_readiness_overridden",
  "certification.milestone_50_reached",
  "assessment.readiness_requested",
  "assessment.readiness_approved",
  "assessment.readiness_rejected",
  "assessment.assessor_assigned",
  "assessment.scheduled",
  "assessment.revision_required",
  "assessment.passed",
  "assessment.failed",
  "assessment.remediation_verified",
  "certification.approved",
  "certification.suspended",
  "certification.revoked",
  "certification.reinstated",
  "certification.overridden",
  "certificate.issued",
  "certificate.replaced",
  "certificate.revoked",
  "role.assigned",
  "role.removed",
] as const;

export type TransactionalEmailEventType = (typeof transactionalEmailEventTypes)[number];
export type SafeEmailMetadata = Readonly<Record<string, string | number | boolean | null>>;
export type TransactionalEmailStatus =
  | "pending"
  | "sending"
  | "provider_accepted"
  | "delivered"
  | "retry_scheduled"
  | "failed_permanent"
  | "suppressed";

export type EmailPreference = {
  key: EmailPreferenceKey;
  enabled: boolean;
};

export type TransactionalEmailDelivery = {
  id: string;
  eventId: string;
  eventType: TransactionalEmailEventType;
  eventMetadata: SafeEmailMetadata;
  recipientUserId: string;
  recipientEmail: string;
  recipientName: string | null;
  locale: Locale;
  templateKey: TransactionalEmailEventType;
  templateVersion: string;
  destinationPath: string;
  idempotencyKey: string;
  status: TransactionalEmailStatus;
  attemptCount: number;
};

export type EnqueueTransactionalEmailInput = {
  eventType: TransactionalEmailEventType;
  eventKey: string;
  metadata: SafeEmailMetadata;
  occurredAt: string;
  recipientUserId: string;
  locale: Locale;
  destinationPath: string;
  idempotencyKey: string;
  required: boolean;
  preferenceKey?: EmailPreferenceKey;
};

export type TransactionalEmailResult =
  | { succeeded: true; providerMessageId: string | null }
  | {
      succeeded: false;
      failureCode: string;
      failureMessage: string;
      retryable: boolean;
    };

import "server-only";

import { EmailDeliveryError } from "@/server/services/email.service";

type UserInviteOperation = "create" | "resend";

const EMAIL_ADDRESS_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const URL_PATTERN = /https?:\/\/\S+/gi;
const SENSITIVE_VALUE_PATTERN = /\b(api[-_ ]?key|token(?:_hash)?)\s*[=:]\s*\S+/gi;
const MAX_LOG_DETAIL_LENGTH = 2_000;

function sanitizeLogDetail(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  return value
    .replace(EMAIL_ADDRESS_PATTERN, "[redacted-email]")
    .replace(URL_PATTERN, "[redacted-url]")
    .replace(SENSITIVE_VALUE_PATTERN, "$1=[redacted]")
    .slice(0, MAX_LOG_DETAIL_LENGTH);
}

function errorCode(error: unknown) {
  if (error instanceof EmailDeliveryError) {
    return error.code;
  }

  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && typeof error.code === "string"
  ) {
    return error.code;
  }

  return error instanceof Error ? error.name : "unknown_error";
}

export function logUserInviteFailure(operation: UserInviteOperation, error: unknown) {
  const errorDetails = error instanceof Error
    ? {
        errorName: error.name,
        errorMessage: sanitizeLogDetail(error.message),
        errorStack: sanitizeLogDetail(error.stack),
      }
    : {
        errorName: "UnknownError",
        errorMessage: "A non-Error value was thrown.",
      };

  console.error({
    eventType: "user.invite",
    operation,
    outcome: "failed",
    failureCode: errorCode(error),
    ...errorDetails,
    ...(error instanceof EmailDeliveryError
      ? {
          retryable: error.retryable,
          ...(error.providerStatus !== undefined
            ? { providerStatus: error.providerStatus }
            : {}),
          ...(error.providerCode
            ? { providerCode: sanitizeLogDetail(error.providerCode) }
            : {}),
          ...(error.providerMessage
            ? { providerMessage: sanitizeLogDetail(error.providerMessage) }
            : {}),
        }
      : {}),
  });
}

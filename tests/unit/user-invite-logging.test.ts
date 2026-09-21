import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { EmailDeliveryError } from "@/server/services/email.service";
import { logUserInviteFailure } from "@/server/services/user-invite-logging.service";

describe("user invite failure logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs sanitized Brevo metadata for invite failures", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new EmailDeliveryError(
      "The email provider rejected https://example.test/invite?token_hash=secret.",
      "email_provider_http_401",
      false,
      {
        status: 401,
        code: "unauthorized",
        message: "Sender person@example.test has api-key=secret-value",
      }
    );

    logUserInviteFailure("create", error);

    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "user.invite",
      operation: "create",
      outcome: "failed",
      failureCode: "email_provider_http_401",
      retryable: false,
      providerStatus: 401,
      providerCode: "unauthorized",
      providerMessage: "Sender [redacted-email] has api-key=[redacted]",
      errorMessage: "The email provider rejected [redacted-url]",
    }));

    const logged = JSON.stringify(consoleError.mock.calls[0]);
    expect(logged).not.toContain("person@example.test");
    expect(logged).not.toContain("secret-value");
    expect(logged).not.toContain("token_hash=secret");
  });

  it("logs unexpected errors with a sanitized message and stack", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const error = new Error("Supabase failed for person@example.test");

    logUserInviteFailure("resend", error);

    expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "user.invite",
      operation: "resend",
      failureCode: "Error",
      errorName: "Error",
      errorMessage: "Supabase failed for [redacted-email]",
      errorStack: expect.any(String),
    }));
  });

  it.each([
    ["email_configuration_error", false],
    ["email_provider_unreachable", true],
  ])("identifies %s failures", (code, retryable) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logUserInviteFailure(
      "create",
      new EmailDeliveryError("Invite email delivery failed.", code, retryable)
    );

    expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({
      eventType: "user.invite",
      operation: "create",
      failureCode: code,
      retryable,
    }));
  });

  it("is used by both initial invite and resend actions", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "features/user-management/actions.ts"),
      "utf8"
    );

    expect(actions).toContain('logUserInviteFailure("create", error)');
    expect(actions).toContain('logUserInviteFailure("resend", error)');
  });
});

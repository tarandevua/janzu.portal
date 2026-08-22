import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TransactionalEmailDelivery } from "@/server/models/transactional-email.model";

const mocks = vi.hoisted(() => ({
  claim: vi.fn(),
  record: vi.fn(),
  send: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getEmailEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://portal.example" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ kind: "admin" }),
}));
vi.mock("@/server/repositories/transactional-email.repository", () => ({
  claimTransactionalEmailDeliveries: mocks.claim,
  enqueueTransactionalEmailDelivery: vi.fn(),
  listEmailPreferences: vi.fn(),
  recordTransactionalEmailResult: mocks.record,
  recordTransactionalEmailWebhook: vi.fn(),
  saveEmailPreferences: vi.fn(),
}));
vi.mock("@/server/services/email.service", () => ({
  EmailDeliveryError: class EmailDeliveryError extends Error {
    constructor(
      message: string,
      readonly code: string,
      readonly retryable: boolean
    ) {
      super(message);
    }
  },
  sendTransactionalEmailMessage: mocks.send,
}));
vi.mock("@/server/services/transactional-email-template", () => ({
  assertAuthorizedEmailDestination: vi.fn(),
  assertSafeEmailMetadata: vi.fn(),
  buildTransactionalEmailTemplate: () => ({
    subject: "Test subject",
    htmlContent: "<p>Test</p>",
    textContent: "Test",
  }),
}));

import { processTransactionalEmailBatch } from "@/server/services/transactional-email.service";

const delivery: TransactionalEmailDelivery = {
  id: "50000000-0000-4000-8000-000000000001",
  eventId: "50000000-0000-4000-8000-000000000002",
  eventType: "role.assigned",
  eventMetadata: { role_label: "Instructor" },
  recipientUserId: "50000000-0000-4000-8000-000000000003",
  recipientEmail: "recipient@example.test",
  recipientName: "Test Recipient",
  locale: "en",
  templateKey: "role.assigned",
  templateVersion: "v1",
  destinationPath: "/en/dashboard",
  idempotencyKey: "role:assigned:test-recipient",
  status: "sending",
  attemptCount: 1,
};

describe("TASK-502 transactional email processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claim.mockResolvedValue([delivery]);
    mocks.send.mockResolvedValue("<provider-message-id>");
    mocks.record.mockResolvedValue(undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  it("records normalized provider acceptance once", async () => {
    await expect(processTransactionalEmailBatch()).resolves.toBe(1);

    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.record).toHaveBeenCalledWith(
      { kind: "admin" },
      delivery.id,
      { succeeded: true, providerMessageId: "provider-message-id" }
    );
  });

  it("propagates persistence failures instead of reclassifying and recording twice", async () => {
    mocks.record.mockRejectedValueOnce(new Error("Database unavailable"));

    await expect(processTransactionalEmailBatch()).rejects.toThrow("Database unavailable");
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.record).toHaveBeenCalledTimes(1);
  });
});

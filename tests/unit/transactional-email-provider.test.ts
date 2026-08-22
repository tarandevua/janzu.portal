import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { sendTransactionalEmailMessage } from "@/server/services/email.service";

const firstDeliveryId = "50000000-0000-4000-8000-000000000001";
const secondDeliveryId = "50000000-0000-4000-8000-000000000002";

describe("TASK-502 Brevo provider idempotency", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal.example");
    vi.stubEnv("BREVO_API_KEY", "test-api-key");
    vi.stubEnv("BREVO_SENDER_EMAIL", "sender@example.test");
    vi.stubEnv("BREVO_SENDER_NAME", "Janzu Test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({ messageId: "<provider-message-id>" }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  async function send(deliveryId: string) {
    return sendTransactionalEmailMessage({
      toEmail: "recipient@example.test",
      toName: "Test Recipient",
      deliveryId,
      subject: "Test subject",
      htmlContent: "<p>Test</p>",
      textContent: "Test",
    });
  }

  function requestBody(callIndex: number) {
    const init = fetchMock.mock.calls[callIndex][1] as RequestInit;
    return JSON.parse(String(init.body)) as {
      headers: { idempotencyKey: string };
      tags: string[];
    };
  }

  it("sends the durable delivery UUID as Brevo's idempotency key", async () => {
    await send(firstDeliveryId);

    expect(requestBody(0)).toMatchObject({
      headers: { idempotencyKey: firstDeliveryId },
      tags: [`delivery:${firstDeliveryId}`],
    });
  });

  it("reuses the same key for retries and isolates different deliveries", async () => {
    await send(firstDeliveryId);
    await send(firstDeliveryId);
    await send(secondDeliveryId);

    expect(requestBody(0).headers.idempotencyKey).toBe(firstDeliveryId);
    expect(requestBody(1).headers.idempotencyKey).toBe(firstDeliveryId);
    expect(requestBody(2).headers.idempotencyKey).toBe(secondDeliveryId);
  });
});

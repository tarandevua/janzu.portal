import { describe, expect, it } from "vitest";
import {
  assertAuthorizedEmailDestination,
  assertSafeEmailMetadata,
  buildTransactionalEmailTemplate,
} from "@/server/services/transactional-email-template";

const id = "50000000-0000-4000-8000-000000000001";

describe("TASK-502 transactional email templates", () => {
  it("renders localized copy without embedding event metadata", () => {
    const metadata = { feedback_id: id, participant_display_name: "Ana", rating: 5 };
    const template = buildTransactionalEmailTemplate({
      eventType: "feedback.received",
      locale: "es",
      displayName: "María",
      destinationUrl: `https://portal.example/es/dashboard/feedback?feedbackId=${id}`,
      metadata,
    });

    expect(template.subject).toBe("Feedback recibido: Recibido");
    expect(template.textContent).toContain("Los detalles privados permanecen");
    expect(template.textContent).not.toContain("Ana");
    expect(template.textContent).not.toContain("rating");
  });

  it("rejects sensitive metadata keys", () => {
    expect(() => assertSafeEmailMetadata({ feedback_text: "private" })).toThrow(
      "Sensitive metadata key"
    );
    expect(() => assertSafeEmailMetadata({ assessment_notes: "private" })).toThrow(
      "Sensitive metadata key"
    );
  });

  it("allows only the exact localized portal destination for an event", () => {
    expect(() =>
      assertAuthorizedEmailDestination(
        "feedback.received",
        "en",
        `/en/dashboard/feedback?feedbackId=${id}`
      )
    ).not.toThrow();
    expect(() =>
      assertAuthorizedEmailDestination(
        "feedback.received",
        "en",
        `/en/dashboard/feedback?feedbackId=${id}&token=secret`
      )
    ).toThrow("does not identify");
    expect(() =>
      assertAuthorizedEmailDestination("feedback.received", "en", "https://evil.test/record")
    ).toThrow("localized portal paths");
  });

  it("includes the public certificate number and verification link without private lifecycle text", () => {
    const certificateId = "50000000-0000-4000-8000-000000000002";
    const template = buildTransactionalEmailTemplate({
      eventType: "certificate.issued",
      locale: "es",
      displayName: "María",
      destinationUrl: `https://portal.example/es/dashboard/certification?certificateId=${certificateId}`,
      metadata: {
        certificateId,
        memberUserId: id,
        certificateNumber: "JZ-2026-AAAA-BBBB-CCCC",
        status: "issued",
      },
    });
    expect(template.textContent).toContain("JZ-2026-AAAA-BBBB-CCCC");
    expect(template.textContent).toContain("/es/certificates/verify/JZ-2026-AAAA-BBBB-CCCC");
    expect(template.textContent).not.toContain("reason");
  });
});

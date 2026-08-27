import { describe, expect, it } from "vitest";
import { whatsappConsentSchema } from "@/server/validators/practitioner.schema";

describe("WhatsApp consent validation", () => {
  it("requires separate affirmative consent and an international number", () => {
    expect(whatsappConsentSchema.safeParse({
      number: "+37360123456",
      visibility: "community",
      affirmativeConsent: true,
      policyVersion: "2026-08-27.v1",
    }).success).toBe(true);

    expect(whatsappConsentSchema.safeParse({
      number: "+37360123456",
      visibility: "community",
      affirmativeConsent: false,
      policyVersion: "2026-08-27.v1",
    }).success).toBe(false);
  });

  it("accepts revocation only when the number is removed and visibility is private", () => {
    expect(whatsappConsentSchema.safeParse({
      number: null,
      visibility: "private",
      affirmativeConsent: false,
      policyVersion: "2026-08-27.v1",
    }).success).toBe(true);

    expect(whatsappConsentSchema.safeParse({
      number: null,
      visibility: "public",
      affirmativeConsent: true,
      policyVersion: "2026-08-27.v1",
    }).success).toBe(false);
  });
});

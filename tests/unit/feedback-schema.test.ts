import { describe, expect, it } from "vitest";
import { feedbackSchema, feedbackTokenSchema } from "@/server/validators/feedback.schema";

describe("feedbackSchema", () => {
  it("accepts a valid feedback payload", () => {
    const parsed = feedbackSchema.safeParse({
      rating: "5",
      experienceText: "Deeply calming.",
      emotionalImpact: "More grounded.",
      feltInFacilitatorArms: "Safe and relaxed.",
      supportAtEnd: "yes",
      continueWaterProcess: "another_session",
      interestedLearningJanzu: false,
      gdprAgreed: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects ratings outside the allowed range", () => {
    const payload = {
      experienceText: "Deeply calming.",
      feltInFacilitatorArms: "Safe and relaxed.",
      supportAtEnd: "yes",
      continueWaterProcess: "another_session",
      interestedLearningJanzu: false,
      gdprAgreed: true,
    };

    expect(feedbackSchema.safeParse({ ...payload, rating: 6 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...payload, rating: 0 }).success).toBe(false);
  });

  it("requires support details for other support responses", () => {
    const parsed = feedbackSchema.safeParse({
      rating: 4,
      experienceText: "Helpful.",
      feltInFacilitatorArms: "Held.",
      supportAtEnd: "other",
      continueWaterProcess: "no_thank_you",
      interestedLearningJanzu: false,
      gdprAgreed: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("requires GDPR agreement", () => {
    const parsed = feedbackSchema.safeParse({
      rating: 4,
      experienceText: "Helpful.",
      feltInFacilitatorArms: "Held.",
      supportAtEnd: "yes",
      continueWaterProcess: "no_thank_you",
      interestedLearningJanzu: false,
      gdprAgreed: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("validates feedback tokens", () => {
    expect(feedbackTokenSchema.safeParse("short").success).toBe(false);
    expect(feedbackTokenSchema.safeParse("a".repeat(32)).success).toBe(true);
  });
});

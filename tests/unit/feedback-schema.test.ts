import { describe, expect, it } from "vitest";
import { feedbackSchema, feedbackTokenSchema } from "@/server/validators/feedback.schema";

describe("feedbackSchema", () => {
  it("accepts a valid feedback payload", () => {
    const parsed = feedbackSchema.safeParse({
      rating: "5",
      experienceText: "Deeply calming.",
      emotionalImpact: "More grounded.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects ratings outside the allowed range", () => {
    expect(feedbackSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(feedbackSchema.safeParse({ rating: 0 }).success).toBe(false);
  });

  it("validates feedback tokens", () => {
    expect(feedbackTokenSchema.safeParse("short").success).toBe(false);
    expect(feedbackTokenSchema.safeParse("a".repeat(32)).success).toBe(true);
  });
});

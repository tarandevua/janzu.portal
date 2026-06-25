import { describe, expect, it } from "vitest";
import { magicLinkSchema } from "@/features/auth/schemas";

describe("magicLinkSchema", () => {
  it("accepts a valid email", () => {
    const parsed = magicLinkSchema.safeParse({ email: "practitioner@example.com" });

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const parsed = magicLinkSchema.safeParse({ email: "not-an-email" });

    expect(parsed.success).toBe(false);
  });
});

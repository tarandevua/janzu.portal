import { describe, expect, it } from "vitest";
import { sessionSchema } from "@/server/validators/session.schema";

describe("sessionSchema", () => {
  it("accepts a valid session payload", () => {
    const parsed = sessionSchema.safeParse({
      clientId: null,
      sessionDate: "2026-06-25",
      durationMinutes: "90",
      location: "Barcelona pool",
      notes: "Calm session.",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const parsed = sessionSchema.safeParse({
      sessionDate: "25/06/2026",
      durationMinutes: 90,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects zero duration", () => {
    const parsed = sessionSchema.safeParse({
      sessionDate: "2026-06-25",
      durationMinutes: 0,
    });

    expect(parsed.success).toBe(false);
  });
});

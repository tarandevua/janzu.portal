import { describe, expect, it, vi } from "vitest";
import { sessionAvailabilitySchema } from "@/server/validators/session-availability.schema";

describe("sessionAvailabilitySchema", () => {
  it("accepts a future availability slot", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T10:00:00.000Z"));

    const parsed = sessionAvailabilitySchema.parse({
      startsAt: "2026-07-12T14:30",
      durationMinutes: "90",
    });

    expect(parsed.durationMinutes).toBe(90);
    expect(new Date(parsed.endsAt).getTime() - new Date(parsed.startsAt).getTime()).toBe(90 * 60_000);

    vi.useRealTimers();
  });

  it("rejects past availability slots", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T10:00:00.000Z"));

    const parsed = sessionAvailabilitySchema.safeParse({
      startsAt: "2026-07-11T14:30",
      durationMinutes: "60",
    });

    expect(parsed.success).toBe(false);

    vi.useRealTimers();
  });
});

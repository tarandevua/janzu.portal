import { describe, expect, it } from "vitest";
import { buildAdminSessionActivity } from "@/server/services/admin-dashboard.service";

describe("buildAdminSessionActivity", () => {
  it("builds zero-filled daily logged and validated session counts", () => {
    const activity = buildAdminSessionActivity(
      [
        { session_date: "2026-06-24", is_validated: true },
        { session_date: "2026-06-24", is_validated: false },
        { session_date: "2026-06-26", is_validated: true },
      ],
      new Date("2026-06-26T12:00:00.000Z"),
      3
    );

    expect(activity).toEqual([
      { date: "2026-06-24", desktop: 2, mobile: 1 },
      { date: "2026-06-25", desktop: 0, mobile: 0 },
      { date: "2026-06-26", desktop: 1, mobile: 1 },
    ]);
  });
});

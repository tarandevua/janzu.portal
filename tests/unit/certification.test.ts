import { describe, expect, it } from "vitest";
import { toCertificationSummary } from "@/server/services/certification.service";

describe("toCertificationSummary", () => {
  it("calculates remaining sessions and percentage", () => {
    const summary = toCertificationSummary({
      id: "progress-id",
      practitionerId: "practitioner-id",
      validatedSessionsCount: 25,
      requiredSessionsCount: 50,
      status: "in_progress",
      approvedBy: null,
      approvedAt: null,
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    });

    expect(summary.remainingSessionsCount).toBe(25);
    expect(summary.percentComplete).toBe(50);
    expect(summary.isEligible).toBe(false);
  });

  it("caps percentage at 100", () => {
    const summary = toCertificationSummary({
      id: "progress-id",
      practitionerId: "practitioner-id",
      validatedSessionsCount: 60,
      requiredSessionsCount: 50,
      status: "eligible",
      approvedBy: null,
      approvedAt: null,
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    });

    expect(summary.remainingSessionsCount).toBe(0);
    expect(summary.percentComplete).toBe(100);
    expect(summary.isEligible).toBe(true);
  });
});

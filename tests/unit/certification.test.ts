import { describe, expect, it } from "vitest";
import {
  getNextOverrideState,
  toCertificationJourneySummary,
} from "@/server/services/certification.service";
import { certificationOverrideSchema } from "@/server/validators/certification.schema";
import { level2ReadinessDecisionSchema } from "@/server/validators/certification.schema";

const journey = {
  id: "34020000-0000-4000-8000-000000000001",
  traineeUserId: "14020000-0000-4000-8000-000000000001",
  practitionerId: "24020000-0000-4000-8000-000000000001",
  traineeName: "Trainee 402",
  state: "practicum_in_progress" as const,
  countedSessionsCount: 12,
  level1TrainingRecordId: "44020000-0000-4000-8000-000000000001",
  level2TrainingRecordId: null,
  stateChangedAt: "2026-08-25T00:00:00.000Z",
  createdAt: "2026-08-25T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z",
  readinessRequestId: null,
  readinessStatus: null,
  readinessDecisionReason: null,
  canRequestLevel2Review: false,
  canReviewLevel2Request: false,
};

describe("certification journey rules", () => {
  it("calculates the next session milestone from the canonical state", () => {
    const summary = toCertificationJourneySummary(journey);

    expect(summary.sessionMilestone).toBe(25);
    expect(summary.remainingSessionsCount).toBe(13);
    expect(summary.percentComplete).toBe(48);
    expect(summary.nextState).toBe("sessions_25_reached");
  });

  it("uses the cumulative 50-session milestone after Level 2 eligibility", () => {
    const summary = toCertificationJourneySummary({
      ...journey,
      state: "level_2_completed",
      countedSessionsCount: 40,
    });

    expect(summary.sessionMilestone).toBe(50);
    expect(summary.remainingSessionsCount).toBe(10);
    expect(summary.percentComplete).toBe(80);
  });

  it("does not offer an override that could fabricate a passed assessment", () => {
    expect(getNextOverrideState("revision_required")).toBeNull();
    expect(getNextOverrideState("assessment_passed")).toBeNull();
  });

  it("requires a reason and evidence reference for overrides", () => {
    const result = certificationOverrideSchema.safeParse({
      journeyId: journey.id,
      expectedState: journey.state,
      resultingState: "sessions_25_reached",
      reason: "too short",
      evidenceReference: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires reasons for negative Level 2 readiness decisions only", () => {
    const base = {
      requestId: "74030000-0000-4000-8000-000000000001",
      reason: null,
    };

    expect(level2ReadinessDecisionSchema.safeParse({ ...base, status: "approved" }).success).toBe(true);
    expect(level2ReadinessDecisionSchema.safeParse({ ...base, status: "rejected" }).success).toBe(false);
    expect(level2ReadinessDecisionSchema.safeParse({
      ...base,
      status: "revision_required",
      reason: "Complete the missing readiness evidence.",
    }).success).toBe(true);
  });

  it("does not represent readiness approval as Level 2 completion", () => {
    const summary = toCertificationJourneySummary({
      ...journey,
      state: "level_2_review_eligible",
      countedSessionsCount: 25,
      readinessRequestId: "74030000-0000-4000-8000-000000000001",
      readinessStatus: "approved",
    });

    expect(summary.state).toBe("level_2_review_eligible");
    expect(summary.readinessStatus).toBe("approved");
  });
});

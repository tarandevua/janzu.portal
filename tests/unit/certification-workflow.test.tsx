import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CertificationProgressCard } from "@/features/certification/components/certification-progress-card";
import { CertificationJourneyReview } from "@/features/certification/components/certification-journey-review";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import type { CertificationJourneySummary } from "@/server/models/certification.model";

const eligibleJourney: CertificationJourneySummary = {
  id: "34030000-0000-4000-8000-000000000001",
  traineeUserId: "14030000-0000-4000-8000-000000000001",
  practitionerId: "24030000-0000-4000-8000-000000000001",
  traineeName: "Trainee 403",
  state: "level_2_review_eligible",
  countedSessionsCount: 25,
  level1TrainingRecordId: "54030000-0000-4000-8000-000000000001",
  level2TrainingRecordId: null,
  stateChangedAt: "2026-08-27T00:00:00.000Z",
  createdAt: "2026-08-27T00:00:00.000Z",
  updatedAt: "2026-08-27T00:00:00.000Z",
  readinessRequestId: null,
  readinessStatus: null,
  readinessDecisionReason: null,
  canRequestLevel2Review: true,
  canReviewLevel2Request: false,
  currentStateIndex: 4,
  nextState: "level_2_completed",
  sessionMilestone: 25,
  remainingSessionsCount: 0,
  percentComplete: 100,
  validatedSessionsCount: 25,
  requiredSessionsCount: 25,
};

describe("25-session certification workflow UI", () => {
  it("shows the request action only when server-derived eligibility allows it", () => {
    const available = renderToStaticMarkup(
      <CertificationProgressCard locale="en" progress={eligibleJourney} dictionary={en.certification} />
    );
    const unavailable = renderToStaticMarkup(
      <CertificationProgressCard
        locale="en"
        progress={{ ...eligibleJourney, canRequestLevel2Review: false }}
        dictionary={en.certification}
      />
    );

    expect(available).toContain("Request Level 2 review");
    expect(unavailable).not.toContain("<button");
    expect(unavailable).toContain("Complete verified Level 1");
  });

  it("renders the active Instructor decision controls without exposing private reasons", () => {
    const html = renderToStaticMarkup(
      <CertificationJourneyReview
        locale="es"
        journeys={[{
          ...eligibleJourney,
          readinessRequestId: "74030000-0000-4000-8000-000000000001",
          readinessStatus: "pending",
          canRequestLevel2Review: false,
          canReviewLevel2Request: true,
        }]}
        canOverride={false}
        dictionary={es.certification}
      />
    );

    expect(html).toContain("Aprobar preparación");
    expect(html).toContain("Requerir revisión");
    expect(html).toContain("name=\"decision\"");
    expect(html).not.toContain("readinessDecisionReason");
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstructorSupervisionDashboard } from "@/features/supervision/components/instructor-supervision-dashboard";
import en from "@/messages/en.json";
import es from "@/messages/es.json";

describe("InstructorSupervisionDashboard", () => {
  it("shows every required summary with an authorized source link", () => {
    render(
      <InstructorSupervisionDashboard
        locale="en"
        dictionary={en.supervision}
        stateLabels={en.certification.states}
        trainees={[{
          assignmentId: "42030000-0000-4000-8000-000000000001",
          traineeUserId: "12030000-0000-4000-8000-000000000001",
          traineeName: "Trainee 203",
          practitionerId: "22030000-0000-4000-8000-000000000001",
          currentLevel: "level_1",
          verifiedTrainingCount: 1,
          latestVerifiedTrainingId: "52030000-0000-4000-8000-000000000001",
          journeyId: "82030000-0000-4000-8000-000000000001",
          journeyState: "practicum_in_progress",
          countedSessionsCount: 12,
          nextSessionMilestone: 25,
          recentFeedbackId: "72030000-0000-4000-8000-000000000001",
          recentFeedbackSessionDate: "2026-08-20",
          recentFeedbackRating: 5,
        }]}
      />
    );

    expect(screen.getByText("Trainee 203")).toBeTruthy();
    expect(screen.getAllByRole("link")).toHaveLength(6);
    expect(screen.getByText("12 / 25").closest("a")?.getAttribute("href")).toContain(
      "/dashboard/certification#journey-"
    );
    expect(screen.getByText(/5 of 5/).closest("a")?.getAttribute("href")).toContain(
      "feedbackId=72030000-0000-4000-8000-000000000001"
    );
    expect(document.body.textContent).not.toMatch(/participant@example|private feedback/i);
  });

  it("has a useful empty state", () => {
    render(
      <InstructorSupervisionDashboard
        locale="es"
        dictionary={es.supervision}
        stateLabels={es.certification.states}
        trainees={[]}
      />
    );

    expect(screen.getByText(es.supervision.dashboardEmpty)).toBeTruthy();
  });
});

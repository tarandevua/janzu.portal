import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssessmentWorkflow } from "@/features/certification/components/assessment-workflow";
import { assessmentOutcomeSchema, assessmentReadinessDecisionSchema } from "@/server/validators/certification.schema";

describe("assessment workflow", () => {
  it("requires reasons for rejected readiness and next actions for non-passing outcomes", () => {
    expect(assessmentReadinessDecisionSchema.safeParse({ requestId: crypto.randomUUID(), approve: "rejected", reason: null }).success).toBe(false);
    expect(assessmentOutcomeSchema.safeParse({ assessmentId: crypto.randomUUID(), status: "failed", notes: null, nextAction: null }).success).toBe(false);
    expect(assessmentOutcomeSchema.safeParse({ assessmentId: crypto.randomUUID(), status: "passed", notes: null, nextAction: null }).success).toBe(true);
  });

  it("renders the recorded private outcome and explicit next action without mutation controls", () => {
    const dictionary = {
      assessmentTitle: "Assessment workflow", assessmentDescription: "Description", assessmentEmpty: "Empty",
      assessmentReadiness: "Not requested", requestAssessmentReadiness: "Request", assessmentReadinessPending: "Pending",
      assessmentReadinessApproved: "Approved", assessmentReadinessRejected: "Rejected", assessmentReadinessInvalidated: "Invalidated",
      approveAssessmentReadiness: "Approve", rejectAssessmentReadiness: "Reject", assessmentDecisionReason: "Reason",
      assessmentDecisionReasonPlaceholder: "Reason", assessor: "Assessor", unassignedAssessor: "Unassigned", assignAssessor: "Assign",
      scheduleAssessment: "Schedule", assessmentDate: "Date", recordOutcome: "Record", outcome: "Outcome",
      assessmentNotes: "Notes", assessmentNotesPlaceholder: "Notes", nextAction: "Next action", nextActionPlaceholder: "Next",
      verifyRemediation: "Verify", revision: "Attempt", assessedOn: "Recorded", assessorAuthorizationTitle: "Authorization",
      assessorAuthorizationDescription: "Authorization description", designationReason: "Reason", designateAssessor: "Designate",
      revokeAssessor: "Revoke", activeAssessor: "Active", inactiveAssessor: "Inactive",
      assessmentStatus: { awaiting_assessor: "Awaiting", scheduled: "Scheduled", incomplete: "Incomplete", revision_required: "Revision", failed: "Failed", passed: "Passed" },
      assessmentOutcomeOptions: { incomplete: "Incomplete", revision_required: "Revision", failed: "Failed", passed: "Passed" },
      assessmentStatusMessages: {},
    };
    const html = renderToStaticMarkup(<AssessmentWorkflow locale="en" candidates={[]} canManageAssessors={false} dictionary={dictionary} items={[{
      journeyId: crypto.randomUUID(), traineeUserId: crypto.randomUUID(), traineeName: "Trainee", journeyState: "revision_required",
      countedSessionsCount: 50, readinessRequestId: crypto.randomUUID(), readinessStatus: "approved", readinessDecisionReason: null,
      assessmentId: crypto.randomUUID(), revisionNumber: 1, assessorUserId: crypto.randomUUID(), assessorName: "Assessor",
      scheduledAt: "2026-09-10T10:00:00Z", assessmentStatus: "failed", assessedAt: "2026-09-10T12:00:00Z",
      notes: "Private remediation summary", nextAction: "Complete supervised remediation practice.", remediationVerifiedAt: null,
      canRequestReadiness: false, canDecideReadiness: false, canAssignAssessor: false, canSchedule: false,
      canRecordOutcome: false, canVerifyRemediation: false,
    }]} />);
    expect(html).toContain("Private remediation summary");
    expect(html).toContain("Complete supervised remediation practice.");
    expect(html).not.toContain("Record outcome</button>");
  });
});

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  designate: vi.fn(),
  assign: vi.fn(),
  cancel: vi.fn(),
  loading: vi.fn(() => "assessment-toast"),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/features/certification/actions", () => ({
  manageAssessorDesignationInline: mocks.designate,
  assignAssessmentInline: mocks.assign,
  cancelAssessmentAssignmentInline: mocks.cancel,
}));

vi.mock("sonner", () => ({
  toast: {
    loading: mocks.loading,
    success: mocks.success,
    error: mocks.error,
  },
}));

import {
  AssessorAssignmentForm,
  AssessorDesignationForm,
} from "@/features/certification/components/assessment-ajax-forms";

const statusMessages = {
  "assessor-designation-saved": "Assessor authorization updated.",
  "assessor-designation-invalid": "Enter a valid reason.",
  "assessor-designation-failed": "Could not update authorization.",
  "assessment-assignment-saved": "Assessor assigned.",
  "assessment-assignment-invalid": "Choose an Assessor.",
  "assessment-assignment-failed": "Could not assign Assessor.",
  "assessment-assignment-cancelled": "Assessor assignment cancelled.",
  "assessment-cancellation-failed": "Could not cancel assignment.",
};

const candidate = {
  userId: "14040000-0000-4000-8000-000000000003",
  displayName: "Authorized Instructor",
  active: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("AJAX-style Assessor forms", () => {
  it("designates an Assessor with a toast and data refresh", async () => {
    mocks.designate.mockResolvedValue({
      ok: true,
      status: "assessor-designation-saved",
    });

    render(
      <AssessorDesignationForm
        locale="en"
        candidate={candidate}
        dictionary={{
          designationReason: "Authorization reason",
          designateAssessor: "Designate Assessor",
          revokeAssessor: "Revoke designation",
          activeAssessor: "Authorized",
          inactiveAssessor: "Not authorized",
          assessmentStatusMessages: statusMessages,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Authorization reason"), {
      target: { value: "Approved assessment training" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Designate Assessor" }));

    await waitFor(() => expect(mocks.designate).toHaveBeenCalledOnce());
    expect(mocks.success).toHaveBeenCalledWith(
      "Assessor authorization updated.",
      { id: "assessment-toast" }
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("assigns an authorized Assessor with a toast and data refresh", async () => {
    mocks.assign.mockResolvedValue({
      ok: true,
      status: "assessment-assignment-saved",
    });

    render(
      <AssessorAssignmentForm
        locale="en"
        assessmentId="24040000-0000-4000-8000-000000000001"
        candidates={[{ ...candidate, active: true }]}
        currentAssessorUserId={null}
        dictionary={{
          assessor: "Assessor",
          unassignedAssessor: "Choose an authorized Assessor",
          assignAssessor: "Assign Assessor",
          changeAssessor: "Change Assessor",
          cancelAssessorAssignment: "Cancel Assessor assignment",
          assessmentStatusMessages: statusMessages,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Assessor"), {
      target: { value: candidate.userId },
    });
    fireEvent.click(screen.getByRole("button", { name: "Assign Assessor" }));

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce());
    expect(mocks.success).toHaveBeenCalledWith("Assessor assigned.", {
      id: "assessment-toast",
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("changes or cancels an Assessor while the assessment is awaiting scheduling", async () => {
    mocks.assign.mockResolvedValue({
      ok: true,
      status: "assessment-assignment-saved",
    });
    mocks.cancel.mockResolvedValue({
      ok: true,
      status: "assessment-assignment-cancelled",
    });
    const currentAssessor = { ...candidate, active: true };
    const replacement = {
      userId: "14040000-0000-4000-8000-000000000006",
      displayName: "Replacement Assessor",
      active: true,
    };

    render(
      <AssessorAssignmentForm
        locale="en"
        assessmentId="24040000-0000-4000-8000-000000000001"
        candidates={[currentAssessor, replacement]}
        currentAssessorUserId={currentAssessor.userId}
        dictionary={{
          assessor: "Assessor",
          unassignedAssessor: "Choose an authorized Assessor",
          assignAssessor: "Assign Assessor",
          changeAssessor: "Change Assessor",
          cancelAssessorAssignment: "Cancel Assessor assignment",
          assessmentStatusMessages: statusMessages,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Assessor"), {
      target: { value: replacement.userId },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change Assessor" }));

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce());
    const reassignment = mocks.assign.mock.calls[0]?.[1] as FormData;
    expect(reassignment.get("assessorUserId")).toBe(replacement.userId);

    fireEvent.click(screen.getByRole("button", { name: "Cancel Assessor assignment" }));

    await waitFor(() => expect(mocks.cancel).toHaveBeenCalledOnce());
    const cancellation = mocks.cancel.mock.calls[0]?.[1] as FormData;
    expect(cancellation.get("assessmentId")).toBe("24040000-0000-4000-8000-000000000001");
    expect(mocks.success).toHaveBeenCalledWith("Assessor assignment cancelled.", {
      id: "assessment-toast",
    });
  });

  it("revokes an Assessor designation through the same inline action", async () => {
    mocks.designate.mockResolvedValue({
      ok: true,
      status: "assessor-designation-saved",
    });

    render(
      <AssessorDesignationForm
        locale="en"
        candidate={{ ...candidate, active: true }}
        dictionary={{
          designationReason: "Authorization reason",
          designateAssessor: "Designate Assessor",
          revokeAssessor: "Revoke designation",
          activeAssessor: "Authorized",
          inactiveAssessor: "Not authorized",
          assessmentStatusMessages: statusMessages,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Authorization reason"), {
      target: { value: "Authorization is no longer current" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Revoke designation" }));

    await waitFor(() => expect(mocks.designate).toHaveBeenCalledOnce());
    const submittedFormData = mocks.designate.mock.calls[0]?.[1] as FormData;
    expect(submittedFormData.get("active")).toBe("false");
    expect(mocks.success).toHaveBeenCalledWith(
      "Assessor authorization updated.",
      { id: "assessment-toast" }
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows an error toast without refreshing when designation fails", async () => {
    mocks.designate.mockResolvedValue({
      ok: false,
      status: "assessor-designation-failed",
    });

    render(
      <AssessorDesignationForm
        locale="en"
        candidate={candidate}
        dictionary={{
          designationReason: "Authorization reason",
          designateAssessor: "Designate Assessor",
          revokeAssessor: "Revoke designation",
          activeAssessor: "Authorized",
          inactiveAssessor: "Not authorized",
          assessmentStatusMessages: statusMessages,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Authorization reason"), {
      target: { value: "Approved assessment training" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Designate Assessor" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(
      "Could not update authorization.",
      { id: "assessment-toast" }
    ));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

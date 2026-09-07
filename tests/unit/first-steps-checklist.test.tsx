import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FirstStepsChecklist } from "@/features/onboarding/components/first-steps-checklist";
import en from "@/messages/en.json";
import type { OnboardingProgress } from "@/server/models/onboarding.model";

const { setAlliance, setGuide, successToast, errorToast, refresh } = vi.hoisted(() => ({
  setAlliance: vi.fn(),
  setGuide: vi.fn(),
  successToast: vi.fn(),
  errorToast: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/features/onboarding/actions", () => ({
  setLearningAlliance: setAlliance,
  setGuideComplete: setGuide,
}));
vi.mock("sonner", () => ({ toast: { success: successToast, error: errorToast } }));

const progress: OnboardingProgress = {
  allianceAccepted: false,
  profileComplete: false,
  trainingStarted: false,
  instructorSelected: false,
  completedGuides: [],
  completedCount: 0,
  totalCount: 7,
  nextHref: "/en/dashboard/first-steps#learning-alliance",
  complete: false,
};

describe("FirstStepsChecklist", () => {
  beforeEach(() => {
    setAlliance.mockReset();
    setGuide.mockReset();
    successToast.mockReset();
    errorToast.mockReset();
    refresh.mockReset();
  });
  afterEach(cleanup);

  it("updates the Learning Alliance in place and shows the result in a toast", async () => {
    setAlliance.mockResolvedValue({ ok: true, status: "alliance-accepted" });
    const initialUrl = window.location.href;
    render(<FirstStepsChecklist locale="en" progress={progress} dictionary={en.firstSteps} />);

    fireEvent.click(screen.getByRole("button", { name: en.firstSteps.accept }));

    await waitFor(() => {
      expect(setAlliance).toHaveBeenCalledOnce();
      expect(successToast).toHaveBeenCalledWith(en.firstSteps.allianceAccepted);
      expect(refresh).toHaveBeenCalledOnce();
    });
    expect(window.location.href).toBe(initialUrl);
  });

  it("updates guidance in place and shows validation errors in a toast", async () => {
    setGuide.mockResolvedValue({ ok: false, status: "invalid" });
    render(<FirstStepsChecklist locale="en" progress={progress} dictionary={en.firstSteps} />);

    fireEvent.click(screen.getAllByRole("button", { name: en.firstSteps.markComplete })[0]);

    await waitFor(() => {
      expect(setGuide).toHaveBeenCalledOnce();
      expect(errorToast).toHaveBeenCalledWith(en.firstSteps.invalid);
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
